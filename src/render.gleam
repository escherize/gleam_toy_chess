import file
import position
import rank

pub type SquareColor {
  Light
  Dark
}

pub fn bg_color(p: position.Position) -> SquareColor {
  case { rank.to_int(p.rank) + file.to_int(p.file) } % 2 == 0 {
    True -> Dark
    False -> Light
  }
}
