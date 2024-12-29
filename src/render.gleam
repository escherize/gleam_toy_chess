import point

pub fn bg_color(p: point.Point) -> String {
  case { point.x(p) + point.y(p) } % 2 == 0 {
    True -> "dark"
    False -> "light"
  }
}
