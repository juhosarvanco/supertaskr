//! Codex exec JSONL, separate from the historical Claude stream grammar.
//! Completed agent items are authoritative snapshots; updated items never
//! become duplicated text. Only turn.completed can finalize a successful turn.
use super::runner::{bounded_stream_string, StreamLine, TurnUsage, MAX_AUTH_MESSAGE_BYTES};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

#[derive(Default)]
pub(super) struct CodexStream {
    last_message: Option<String>,
    completed_messages: BTreeMap<String, [u8; 32]>,
    finished: bool,
    pub usage: Option<TurnUsage>,
}
impl CodexStream {
    pub fn classify_line(&mut self, line: &str) -> StreamLine {
        let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
            return StreamLine::NotJson;
        };
        let kind = value["type"].as_str().unwrap_or("");
        if self.finished
            && matches!(
                kind,
                "thread.started"
                    | "turn.started"
                    | "turn.completed"
                    | "turn.failed"
                    | "item.completed"
            )
        {
            return StreamLine::ProtocolError(
                "Codex emitted another turn/item after its terminal event".into(),
            );
        }
        match kind {
            "thread.started" => StreamLine::Init {
                session_id: value["thread_id"].as_str().map(str::to_owned),
                model: value["model"].as_str().map(str::to_owned),
            },
            "item.completed" if value["item"]["type"] == "agent_message" => {
                let (Some(id), Some(text)) =
                    (value["item"]["id"].as_str(), value["item"]["text"].as_str())
                else {
                    return StreamLine::ProtocolError(
                        "Codex completed agent item has no identity/text".into(),
                    );
                };
                if id.is_empty() || id.len() > 256 {
                    return StreamLine::ProtocolError("Codex item identity is unavailable".into());
                }
                let digest: [u8; 32] = Sha256::digest(text.as_bytes()).into();
                if let Some(prior) = self.completed_messages.get(id) {
                    return if prior == &digest {
                        StreamLine::Ignored
                    } else {
                        StreamLine::ProtocolError("Codex changed a completed agent item".into())
                    };
                }
                if self.completed_messages.len() >= 512 {
                    return StreamLine::ProtocolError(
                        "Codex completed-message count exceeds the bounded turn".into(),
                    );
                }
                self.completed_messages.insert(id.into(), digest);
                self.last_message = Some(text.into());
                StreamLine::TextDelta(format!("{text}\n\n"))
            }
            "item.started" | "item.updated" | "item.completed" => {
                match value["item"]["type"].as_str() {
                    Some("command_execution") => StreamLine::Activity("Running command".into()),
                    Some("file_change") => StreamLine::Activity("Editing files".into()),
                    Some("mcp_tool_call") => StreamLine::Activity("Calling configured tool".into()),
                    Some("web_search") => StreamLine::Activity("Searching the web".into()),
                    Some("reasoning") => StreamLine::Activity("Thinking".into()),
                    _ => StreamLine::Ignored,
                }
            }
            "turn.completed" => {
                self.finished = true;
                if let Some(usage) = value.get("usage").filter(|usage| !usage.is_null()) {
                    match serde_json::from_value::<TurnUsage>(usage.clone()) {
                        Ok(usage) if usage.cached_input_tokens <= usage.input_tokens => {
                            self.usage = Some(usage)
                        }
                        _ => {
                            return StreamLine::ProtocolError("Codex token usage is invalid".into())
                        }
                    }
                }
                match self.last_message.take() {
                    Some(text) => StreamLine::Result {
                        text,
                        is_error: false,
                        api_error_status: None,
                        terminal_reason: None,
                        permission_denials: Vec::new(),
                    },
                    None => StreamLine::ProtocolError(
                        "Codex completed the turn without a completed agent message".into(),
                    ),
                }
            }
            "turn.failed" => {
                self.finished = true;
                StreamLine::Result {
                    text: error_message(&value),
                    is_error: true,
                    api_error_status: error_status(&value),
                    terminal_reason: Some("codex_turn_failed".into()),
                    permission_denials: Vec::new(),
                }
            }
            "error" => StreamLine::Diagnostic {
                note: error_message(&value),
                error_status: error_status(&value),
            },
            _ => StreamLine::Ignored,
        }
    }
}
fn error_message(value: &serde_json::Value) -> String {
    let text = value["error"]["message"]
        .as_str()
        .or_else(|| value["message"].as_str())
        .unwrap_or("Codex reported an error without a message");
    bounded_stream_string(text, MAX_AUTH_MESSAGE_BYTES)
}
fn error_status(value: &serde_json::Value) -> Option<u32> {
    let status = value["error"]["status"]
        .as_u64()
        .or_else(|| value["status"].as_u64())?;
    (100..=599).contains(&status).then_some(status as u32)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn completed_items_and_terminal_usage_are_exact_not_updated_snapshots_or_duplicate_relay() {
        let mut stream = CodexStream::default();
        assert!(matches!(
            stream.classify_line(
                r#"{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}"#
            ),
            StreamLine::Init { model: None, .. }
        ));
        assert_eq!(stream.classify_line(r#"{"type":"item.updated","item":{"id":"item_1","type":"agent_message","text":"partial"}}"#), StreamLine::Ignored);
        let commentary = r#"{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"Inspecting the project."}}"#;
        assert!(matches!(
            stream.classify_line(commentary),
            StreamLine::TextDelta(_)
        ));
        assert!(matches!(stream.classify_line(r#"{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"What should this project do?"}}"#), StreamLine::TextDelta(_)));
        assert_eq!(stream.classify_line(commentary), StreamLine::Ignored);
        match stream.classify_line(r#"{"type":"turn.completed","usage":{"input_tokens":100,"cached_input_tokens":70,"output_tokens":12,"reasoning_output_tokens":3}}"#) {
            StreamLine::Result { text, is_error: false, .. } => assert_eq!(text, "What should this project do?"),
            other => panic!("{other:?}"),
        }
        assert_eq!(
            stream.usage,
            Some(TurnUsage {
                input_tokens: 100,
                cached_input_tokens: 70,
                output_tokens: 12,
                reasoning_output_tokens: Some(3)
            })
        );
        assert!(matches!(
            stream.classify_line(commentary),
            StreamLine::ProtocolError(_)
        ));
    }
    #[test]
    fn failure_and_missing_final_message_never_become_success() {
        for line in [
            r#"{"type":"turn.completed"}"#,
            r#"{"type":"turn.completed","usage":{"input_tokens":1,"cached_input_tokens":2,"output_tokens":3}}"#,
        ] {
            assert!(matches!(
                CodexStream::default().classify_line(line),
                StreamLine::ProtocolError(_)
            ));
        }
        assert!(matches!(CodexStream::default().classify_line(r#"{"type":"turn.failed","error":{"message":"Sign in with codex login","status":401}}"#), StreamLine::Result { is_error: true, api_error_status: Some(401), .. }));
        assert!(matches!(
            CodexStream::default()
                .classify_line(r#"{"type":"error","message":"Temporary provider interruption"}"#),
            StreamLine::Diagnostic { .. }
        ));
        assert_eq!(
            CodexStream::default().classify_line("warning: unrelated text"),
            StreamLine::NotJson
        );
        assert_eq!(
            CodexStream::default().classify_line(r#"{"type":"future.event"}"#),
            StreamLine::Ignored
        );
    }
}
