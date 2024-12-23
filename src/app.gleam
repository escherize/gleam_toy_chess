import board.{type Board}
import file
import gleam/list
import gleam/result
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import piece
import position
import rank.{type Rank}
import render
import team.{Black, White}

pub type Model =
  Board

fn init(_flags) -> Model {
  board.new_board()
}

pub type Msg

pub fn update(model: Model, _msg: Msg) -> Model {
  model
}

pub fn render_piece(
  board: Board,
  pos: position.Position,
) -> Result(element.Element(Msg), Nil) {
  use piece <- result.try(board.get(board, pos))
  let piece_color = case piece.team {
    White -> "#0f0"
    Black -> "#fff"
  }
  Ok(
    html.div(
      [attribute.class("square"), attribute.style([#("color", piece_color)])],
      [
        html.span([attribute.style([#("cursor", "grab")])], [
          element.text(piece.to_string(piece)),
        ]),
      ],
    ),
  )
}

pub fn render_square(
  board: Board,
  pos: position.Position,
) -> element.Element(Msg) {
  html.div([attribute.class(render.bg_color(pos))], [
    render_piece(board, pos)
    |> result.unwrap(html.div([], [html.text(" ")])),
  ])
}

pub fn render_rank(board: Board, rank: Rank) -> element.Element(Msg) {
  html.div(
    [attribute.class("file")],
    list.map(file.files(), fn(file) {
      render_square(board, position.Position(rank, file))
    }),
  )
}

pub fn view(model: Model) -> element.Element(Msg) {
  let board = model
  html.pre(
    [attribute.class("chessboard")],
    list.map(rank.ranks(), fn(rank) { render_rank(board, rank) }),
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
