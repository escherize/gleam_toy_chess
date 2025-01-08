import piece
import point
import team

pub fn bg_color(p: point.Point) -> String {
  case { p.x + p.y } % 2 == 0 {
    True -> "dark"
    False -> "light"
  }
}

pub fn piece_color(piece: piece.Piece) -> String {
  case piece.team {
    team.White -> "#bbb"
    team.Black -> "#444"
  }
}
