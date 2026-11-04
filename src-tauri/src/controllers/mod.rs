use gilrs::{Event, EventType, Gilrs};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControllerDevice {
    pub id: usize,
    pub name: String,
    pub power_info: String,
    pub is_connected: bool,
    pub controller_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControllerInputEvent {
    pub controller_id: usize,
    pub event_type: String, // "button_down", "button_up", "axis_changed", "connected", "disconnected"
    pub code: String,
    pub value: f32,
}

pub struct ControllerManager {
    gilrs: Arc<Mutex<Gilrs>>,
}

impl ControllerManager {
    pub fn new() -> Result<Self, String> {
        let gilrs = Gilrs::new().map_err(|e| format!("Failed to initialize Gilrs: {}", e))?;
        Ok(Self {
            gilrs: Arc::new(Mutex::new(gilrs)),
        })
    }

    pub fn list_controllers(&self) -> Vec<ControllerDevice> {
        let gilrs = match self.gilrs.lock() {
            Ok(g) => g,
            Err(_) => return Vec::new(),
        };

        gilrs
            .gamepads()
            .map(|(id, gamepad)| {
                let name = gamepad.name().to_string();
                let name_lower = name.to_lowercase();
                let controller_type = if name_lower.contains("xbox") || name_lower.contains("xinput") {
                    "xbox"
                } else if name_lower.contains("playstation") || name_lower.contains("dualsense") || name_lower.contains("dualshock") {
                    "playstation"
                } else if name_lower.contains("nintendo") || name_lower.contains("switch") {
                    "nintendo"
                } else {
                    "generic"
                };

                let power_info = format!("{:?}", gamepad.power_info());

                ControllerDevice {
                    id: usize::from(id),
                    name,
                    power_info,
                    is_connected: gamepad.is_connected(),
                    controller_type: controller_type.to_string(),
                }
            })
            .collect()
    }

    pub fn poll_next_event(&self) -> Option<ControllerInputEvent> {
        let mut gilrs = match self.gilrs.lock() {
            Ok(g) => g,
            Err(_) => return None,
        };

        while let Some(Event { id, event, .. }) = gilrs.next_event() {
            match event {
                EventType::ButtonPressed(btn, _) => {
                    return Some(ControllerInputEvent {
                        controller_id: usize::from(id),
                        event_type: "button_down".into(),
                        code: format!("{:?}", btn),
                        value: 1.0,
                    });
                }
                EventType::ButtonReleased(btn, _) => {
                    return Some(ControllerInputEvent {
                        controller_id: usize::from(id),
                        event_type: "button_up".into(),
                        code: format!("{:?}", btn),
                        value: 0.0,
                    });
                }
                EventType::AxisChanged(axis, val, _) => {
                    return Some(ControllerInputEvent {
                        controller_id: usize::from(id),
                        event_type: "axis_changed".into(),
                        code: format!("{:?}", axis),
                        value: val,
                    });
                }
                EventType::Connected => {
                    return Some(ControllerInputEvent {
                        controller_id: usize::from(id),
                        event_type: "connected".into(),
                        code: "status".into(),
                        value: 1.0,
                    });
                }
                EventType::Disconnected => {
                    return Some(ControllerInputEvent {
                        controller_id: usize::from(id),
                        event_type: "disconnected".into(),
                        code: "status".into(),
                        value: 0.0,
                    });
                }
                _ => {}
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_controller_manager_initialization() {
        let manager = ControllerManager::new();
        assert!(manager.is_ok());
        if let Ok(mgr) = manager {
            let list = mgr.list_controllers();
            // In headless/test environment, may have 0 or more gamepads
            let _ = list.len();
        }
    }
}
