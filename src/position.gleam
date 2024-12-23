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
pub fn new(file, rank) -> Position {
  Position(file, rank)
}

pub fn parse(s: String) -> Result(Position, String) {
  use f_str <- result.try(
    string.first(s) |> result.map_error(fn(_) { "Could not parse file" }),
  )
  use f <- result.try(file.parse(f_str))
  use r_str <- result.try(
    string.first(string.drop_start(s, 1))
    |> result.map_error(fn(_) { "Could not parse file" }),
  )
  use r <- result.try(rank.parse(r_str))
  Ok(new(f, r))
}

pub fn add(p1: Position, p2: Position) -> Result(Position, String) {
  use new_file <- result.try(file.add(p1.file, p2.file))
  use new_rank <- result.try(rank.add(p1.rank, p2.rank))
  Ok(new(new_file, new_rank))
}

pub fn to_string(p: Position) -> String {
  file.to_string(p.file) <> rank.to_string(p.rank)
}
