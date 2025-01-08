import board
import game.{type Game, Idle, Selected}
import gleam/io
import gleam/list
import gleam/result
import gleam/string
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event.{on_click}
import piece
import point
import pprint
import render

pub type Model =
  Game

fn init(_flags) -> Model {
  game.new()
}

pub type Msg {
  UserClickedPiece(point.Point)
  UserClickedSquare(point.Point)
  UserMovedPieceTo(point.Point)
}

pub fn handle_clicked_piece(model: Model, pt: point.Point) -> Model {
  let board = model.board
  case board.get(board, pt), model.mode {
    Ok(_piece), _ -> {
      game.Game(..model, mode: Selected(pt))
    }
    Error(_), Idle -> {
      model
    }
    Error(_), Selected(_pt) -> {
      game.Game(..model, mode: Idle)
    }
  }
}

pub fn update(model: Model, msg: Msg) -> Model {
  io.debug(#("update got msg: ", msg))
  case msg {
    UserClickedPiece(pos) -> {
      handle_clicked_piece(model, pos)
    }
    UserClickedSquare(_pos) -> {
      case model.mode {
        Selected(_from) -> {
          game.Game(..model, mode: Idle)
        }
        Idle -> {
          model
        }
      }
    }
    UserMovedPieceTo(pos) -> {
      case model.mode {
        Selected(from) -> {
          let board = model.board
          case board.get(board, from) {
            Ok(piece) -> {
              let new_board =
                board |> board.set(pos, piece) |> board.delete(from)
              io.debug(new_board == board)
              game.Game(..model, board: new_board, mode: Idle)
            }
            Error(_) -> {
              model
            }
          }
        }
        Idle -> {
          model
        }
      }
    }
  }
}

pub fn render_piece(
  model: Model,
  pos: point.Point,
) -> Result(element.Element(Msg), String) {
  let board = model.board
  use piece <- result.try(board.get(board, pos))
  let piece_color = render.piece_color(piece)
  Ok(
    html.div(
      [
        attribute.classes([#("piece", True), #("square", True)]),
        attribute.style([#("color", piece_color)]),
        case piece.team == model.team_turn {
          True -> on_click(UserClickedPiece(pos))
          False -> on_click(UserClickedSquare(pos))
        },
      ],
      [
        html.span(
          [
            attribute.style([#("cursor", "grab")]),
            case model.mode {
              Selected(pt) -> {
                case pt == pos {
                  True -> attribute.style([#("color", "red")])
                  False -> attribute.style([#("color", piece_color)])
                }
              }
              _ -> {
                attribute.style([#("color", piece_color)])
              }
            },
          ],
          [element.text(piece.to_string(piece))],
        ),
      ],
    ),
  )
}

pub fn render_idle_square(
  model: Model,
  pos: point.Point,
) -> element.Element(Msg) {
  let board = model.board
  html.div([attribute.class("square"), attribute.class(render.bg_color(pos))], [
    case board.get(board, pos) {
      Ok(_piece) -> {
        render_piece(model, pos)
        |> result.unwrap(element.text("?"))
      }
      Error(_) -> {
        html.div([attribute.style([#("font-size", "10px")])], [
          element.text(
            point.to_string(pos)
            <> "|"
            <> string.inspect(pos.x)
            <> ","
            <> string.inspect(pos.y),
          ),
        ])
      }
    },
  ])
}

pub fn render_selected_square(
  model: Model,
  pos: point.Point,
  legal_moves: List(point.Point),
) -> element.Element(Msg) {
  case list.contains(legal_moves, pos) {
    True -> {
      io.debug(#("legal move: ", pos))
      html.div(
        [
          attribute.style([#("font-size", "13px")]),
          on_click(UserMovedPieceTo(pos)),
        ],
        [element.text(point.to_string(pos))],
      )
    }
    False -> {
      render_idle_square(model, pos)
    }
  }
}

pub fn render_square(model: Model, pos: point.Point) -> element.Element(Msg) {
  case model.mode {
    Selected(pt) -> {
      io.debug(#("selected: ", pt))
      let legal_moves = game.legal_moves(model, pt)
      render_selected_square(model, pos, legal_moves)
    }
    Idle -> {
      render_idle_square(model, pos)
    }
  }
}

pub fn info_section(model: Model) {
  html.div([], [
    element.text(pprint.with_config(
      model.mode,
      pprint.Config(pprint.Unstyled, pprint.BitArraysAsString, pprint.Labels),
    )),
    element.text(case model.mode {
      Selected(pt) -> {
        let legal_moves = game.legal_moves(model, pt)
        pprint.format(legal_moves)
      }
      Idle -> ""
    }),
  ])
}

pub fn view(model: Model) -> element.Element(Msg) {
  let _board = model.board
  html.div([], [
    html.pre(
      [attribute.class("chessboard")],
      list.map(
        // need this to play with A1 on the bottom left:
        point.all() |> list.sized_chunk(8) |> list.reverse |> list.flatten,
        fn(pt) { render_square(model, pt) },
      ),
    ),
    info_section(model),
  ])
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
