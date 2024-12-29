import gleam/int
import gleam/list.{map}
import gleam/string
import util

/// A vertical column on a chess board, numbered from 1 to 8.
/// Adressed via the x axis.
/// The leftmost column is 1, the rightmost column is 8.
type File =
  Int

/// Rows on a chess board, numbered from 1 to 8.
/// Adressed via the y axis.
/// The bottom row is 1, the top row is 8.
/// 1 is the row closest to the black player, 8 is the row closest to the white player.
type Rank =
  Int

/// The x and y coordinates of a chess piece, used for rendering.
pub opaque type Point {
  Point(file: File, rank: Rank)
}

pub fn x(p: Point) -> File {
  p.file
}

pub fn y(p: Point) -> Rank {
  p.rank
}

pub fn indexes() {
  list.range(1, 8)
}

pub fn all() -> List(Point) {
  let ranks = indexes()
  let files = indexes()
  util.cartesian_product(ranks, files)
  |> map(fn(rf) {
    let #(r, f) = rf
    let assert Ok(p) = new(r, f)
    p
  })
}

pub fn new(rank rank: Rank, file file: File) -> Result(Point, String) {
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

pub fn new_ok(rank: Rank, file: File) -> Point {
  case new(rank: rank, file: file) {
    Ok(p) -> p
    Error(_) -> panic as "uh oh, new_ok failed. "
  }
}

pub fn add(c1: Point, c2: Point) -> Result(Point, String) {
  new(c1.rank + c2.rank, c1.file + c2.file)
}

// Printing

pub fn file_str(p: Point) -> String {
  case p.rank {
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
  int.to_string(p.file)
}

pub fn to_string(p: Point) -> String {
  rank_str(p) <> file_str(p)
}

pub fn parse(s: String) -> Result(Point, String) {
  let up = s |> string.uppercase
  let lhs = up |> string.slice(0, 1)
  let rhs = up |> string.slice(1, 2)
  let parse_rank = fn(rhs: String) -> File {
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
