/// The rank and file of a chess piece, used as keys in the board dict
import file
import gleam/list
import rank
import util

pub type Position {
  Position(rank: rank.Rank, file: file.File)
}

pub fn gen_positions() -> List(Position) {
  util.cartesian_product(rank.ranks(), file.files())
  |> list.map(fn(xy) { Position(xy.0, xy.1) })
}
