/// The rank and file of a chess piece, used as keys in the board dict
import file
import gleam/list
import gleam/result
import gleam/string
import rank
import util

// TODO: swap rank and file in the constructor to match the order in the algebraic notation
pub type Position {
  Position(file: file.File, rank: rank.Rank)
}

pub fn gen_positions() -> List(Position) {
  util.cartesian_product(file.files(), rank.ranks())
  |> list.map(fn(xy) { Position(xy.0, xy.1) })
}

///make a new position
pub fn new(file, rank) -> Result(Position, String) {
  case rank, file {
    Ok(r), Ok(f) -> Ok(Position(f, r))
    Ok(_), _ -> Error("Invalid rank")
    _, Ok(_) -> Error("Invalid file")
    _, _ -> Error("Invalid rank and file")
  }
}

pub fn parse(s: String) -> Result(Position, String) {
  use f_str <- result.try(
    string.first(s) |> result.map_error(fn(_) { "Could not parse file" }),
  )
  use r_str <- result.try(
    string.first(string.drop_start(s, 1))
    |> result.map_error(fn(_) { "Could not parse file" }),
  )
  new(file.parse(f_str), rank.parse(r_str))
}

pub fn to_string(p: Position) -> String {
  file.to_string(p.file) <> rank.to_string(p.rank)
}
