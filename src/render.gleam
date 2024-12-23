import file
import position
import rank

pub fn bg_color(p: position.Position) -> String {
  case { rank.to_int(p.rank) + file.to_int(p.file) } % 2 == 0 {
    True -> "dark"
    False -> "light"
  }
}
