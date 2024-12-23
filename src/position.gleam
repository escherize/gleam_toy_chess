/// The rank and file of a chess piece, used as keys in the board dict
import file
import gleam/list
import gleam/result
import gleam/string
import rank
import util

// TODO: swap rank and file in the constructor to match the order in the
// algebraic notation
pub type Position {
  Position(rank: rank.Rank, file: file.File)
}

pub fn gen_positions() -> List(Position) {
  util.cartesian_product(rank.ranks(), file.files())
  |> list.map(fn(xy) { Position(xy.0, xy.1) })
}

pub fn new(rank, file) -> Position {
  Position(rank, file)
}

pub fn from_string(s: String) -> Result(Position, String) {
  use f_str <- result.try(
    string.first(s) |> result.map_error(fn(_) { "Could not parse file" }),
  )
  use f <- result.try(file.from_string(f_str))
  use r_str <- result.try(
    string.first(string.drop_start(s, 1))
    |> result.map_error(fn(_) { "Could not parse file" }),
  )
  use r <- result.try(rank.from_string(r_str))
  Ok(new(r, f))
}
