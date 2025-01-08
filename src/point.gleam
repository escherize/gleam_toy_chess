import gleam/int
import gleam/list.{map}
import gleam/string
import util

/// The x and y coordinates of a chess piece, used for rendering.
pub type Point {
  Point(x: Int, y: Int)
}

/// Returns a list of all the ranks and files on a chess board.
/// These indexes are garanteed to be valid, as they are used to generate all possible points.
/// This is useful for iterating over all the rows/cols on a chess board
pub fn indexes() {
  list.range(1, 8)
}

pub fn all() -> List(Point) {
  let ranks = indexes()
  let files = indexes()
  util.cartesian_product(files, ranks)
  |> map(fn(rf) {
    let #(r, f) = rf
    let assert Ok(p) = new(f, r)
    p
  })
}

pub fn new(rank: Int, file: Int) -> Result(Point, String) {
  case rank >= 1, rank <= 8, file >= 1, file <= 8 {
    True, True, True, True -> Ok(Point(rank, file))
    _, _, _, _ ->
      Error(
        "invalid coordinate:"
        <> int.to_string(rank)
        <> ", "
        <> int.to_string(file),
      )
  }
}

pub fn new_ok(y: Int, x: Int) -> Point {
  case new(y, x) {
    Ok(p) -> p
    Error(_) -> panic as "uh oh, new_ok failed. "
  }
}

pub fn add(c1: Point, c2: Point) -> Result(Point, String) {
  new(c1.y + c2.y, c1.x + c2.x)
}

// Printing

pub fn file_str(p: Point) -> String {
  case p.y {
    1 -> "A"
    2 -> "B"
    3 -> "C"
    4 -> "D"
    5 -> "E"
    6 -> "F"
    7 -> "G"
    8 -> "H"
    _ -> panic as "impossible"
  }
}

pub fn rank_str(p: Point) -> String {
  int.to_string(p.x)
}

pub fn to_string(p: Point) -> String {
  file_str(p) <> rank_str(p)
}

pub fn parse(s: String) -> Result(Point, String) {
  let up = s |> string.uppercase
  let lhs = up |> string.slice(0, 1)
  let rhs = up |> string.slice(1, 2)
  let parse_rank = fn(rhs: String) -> Int {
    case int.parse(rhs) {
      Ok(i) -> i
      Error(_) -> panic as "impossible"
    }
  }
  case lhs {
    "A" -> new(1, parse_rank(rhs))
    "B" -> new(2, parse_rank(rhs))
    "C" -> new(3, parse_rank(rhs))
    "D" -> new(4, parse_rank(rhs))
    "E" -> new(5, parse_rank(rhs))
    "F" -> new(6, parse_rank(rhs))
    "G" -> new(7, parse_rank(rhs))
    "H" -> new(8, parse_rank(rhs))
    _ -> panic as "impossible"
  }
}
