import board.{type Board}
import game.{type Game}
import gleam/io
import gleam/list
import gleam/result
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event.{on_click}
import piece
import point

import render
import team.{Black, White}

pub type Model =
  Game

fn init(_flags) -> Model {
  game.new()
}

pub type Msg {
  UserClicked(point.Point)
}

pub fn handle_click(model: Model, pos: point.Point) -> Model {
  let board = model.board
  case board.get(board, pos) {
    Ok(piece) -> {
      io.debug(#("Clicked:", piece, piece.to_string(piece)))
      // todo: implement piece selected
      model
    }
    Error(_) -> {
      model
    }
  }
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserClicked(pos) -> {
      handle_click(model, pos)
    }
  }
}

pub fn render_piece(
  board: Board,
  pos: point.Point,
) -> Result(element.Element(Msg), String) {
  use piece <- result.try(board.get(board, pos))
  let piece_color = case piece.team {
    White -> "#eee"
    Black -> "#111"
  }
  Ok(
    html.div(
      [
        on_click(UserClicked(pos)),
        attribute.class("square"),
        attribute.class("piece"),
        attribute.style([#("color", piece_color)]),
      ],
      [
        html.span([attribute.style([#("cursor", "grab")])], [
          element.text(piece.to_string(piece)),
        ]),
      ],
    ),
  )
}

pub fn render_square(board: Board, pos: point.Point) -> element.Element(Msg) {
  html.div([attribute.class("square"), attribute.class(render.bg_color(pos))], [
    {
      let spot =
        html.div([attribute.style([#("font-size", "20px")])], [
          element.text(point.to_string(pos)),
        ])
      render_piece(board, pos)
      |> result.unwrap(html.div([], [spot]))
    },
  ])
}

pub fn render_row(board: Board, col: Int) -> element.Element(Msg) {
  html.div(
    [attribute.class("file")],
    list.map(point.indexes() |> list.reverse(), fn(row) {
      let assert Ok(p) = point.new(col, row)
      render_square(board, p)
    }),
  )
}

pub fn view(model: Model) -> element.Element(Msg) {
  let board = model.board
  html.pre(
    [attribute.class("chessboard")],
    list.map(point.indexes() |> list.reverse(), fn(col) {
      render_row(board, col)
    }),
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
