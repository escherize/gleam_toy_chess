pub type Team {
  White
  Black
}

pub fn opposite(team: Team) -> Team {
  case team {
    White -> Black
    Black -> White
  }
}
