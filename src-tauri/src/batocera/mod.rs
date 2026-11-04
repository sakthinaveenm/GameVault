use crate::models::{Game, GameSource};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::time::timeout;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatoceraNodeInfo {
    pub host: String,
    pub port: u16,
    pub is_online: bool,
    pub latency_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatoceraRemoteGame {
    pub path: String,
    pub name: String,
    pub desc: Option<String>,
    pub image: Option<String>,
    pub developer: Option<String>,
    pub genre: Option<String>,
    pub system_id: String,
}

pub struct BatoceraClient;

impl BatoceraClient {
    pub async fn ping_node(host: &str, port: u16) -> BatoceraNodeInfo {
        let addr_str = format!("{}:{}", host, port);
        let start = std::time::Instant::now();

        let online = if let Ok(addr) = addr_str.parse::<SocketAddr>() {
            match timeout(Duration::from_millis(1500), TcpStream::connect(&addr)).await {
                Ok(Ok(_)) => true,
                _ => false,
            }
        } else {
            // DNS resolution attempt
            match timeout(Duration::from_millis(1500), TcpStream::connect((host, port))).await {
                Ok(Ok(_)) => true,
                _ => false,
            }
        };

        let latency_ms = if online {
            Some(start.elapsed().as_millis() as u64)
        } else {
            None
        };

        BatoceraNodeInfo {
            host: host.to_string(),
            port,
            is_online: online,
            latency_ms,
        }
    }

    pub fn parse_gamelist_xml(xml_content: &str, system_id: &str) -> Vec<BatoceraRemoteGame> {
        let mut games = Vec::new();

        // Lightweight standard EmulationStation XML parser
        let game_blocks: Vec<&str> = xml_content.split("<game>").collect();
        for block in game_blocks.iter().skip(1) {
            let block = match block.split("</game>").next() {
                Some(b) => b,
                None => continue,
            };

            let path = Self::extract_tag(block, "path").unwrap_or_default();
            let name = Self::extract_tag(block, "name").unwrap_or_else(|| "Unknown Game".into());
            let desc = Self::extract_tag(block, "desc");
            let image = Self::extract_tag(block, "image");
            let developer = Self::extract_tag(block, "developer");
            let genre = Self::extract_tag(block, "genre");

            if !path.is_empty() {
                games.push(BatoceraRemoteGame {
                    path,
                    name,
                    desc,
                    image,
                    developer,
                    genre,
                    system_id: system_id.to_string(),
                });
            }
        }

        games
    }

    pub fn convert_to_game(remote: BatoceraRemoteGame, host: &str) -> Game {
        Game {
            id: format!("batocera-{}-{}", remote.system_id, remote.name.replace(' ', "_")),
            title: remote.name,
            sort_title: None,
            summary: remote.desc,
            developer: remote.developer,
            publisher: None,
            release_date: None,
            source: GameSource::Batocera,
            platform: remote.system_id,
            store_id: Some(format!("batocera://{}/{}", host, remote.path)),
            executable_path: Some(format!("batocera://{}/{}", host, remote.path)),
            launch_arguments: None,
            working_directory: None,
            cover_url: remote.image,
            banner_url: None,
            icon_url: None,
            installed: false, // Hosted remotely
            is_favorite: false,
            playtime_minutes: 0,
            last_played_at: None,
        }
    }

    fn extract_tag(block: &str, tag: &str) -> Option<String> {
        let open_tag = format!("<{}>", tag);
        let close_tag = format!("</{}>", tag);

        let start = block.find(&open_tag)? + open_tag.len();
        let end = block[start..].find(&close_tag)? + start;
        Some(block[start..end].trim().to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_batocera_gamelist_xml() {
        let sample_xml = r#"
        <?xml version="1.0"?>
        <gameList>
            <game>
                <path>./SuperMarioKart.sfc</path>
                <name>Super Mario Kart</name>
                <desc>The classic go-kart racing game.</desc>
                <image>./images/SuperMarioKart-thumb.png</image>
                <developer>Nintendo</developer>
                <genre>Racing</genre>
            </game>
        </gameList>
        "#;

        let games = BatoceraClient::parse_gamelist_xml(sample_xml, "snes");
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "Super Mario Kart");
        assert_eq!(games[0].developer.as_deref(), Some("Nintendo"));
        assert_eq!(games[0].system_id, "snes");

        let app_game = BatoceraClient::convert_to_game(games[0].clone(), "192.168.1.100");
        assert_eq!(app_game.source, GameSource::Batocera);
        assert!(!app_game.installed);
    }
}
