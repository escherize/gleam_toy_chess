import team

pub type PieceType {
  Pawn
  Rook
  Knight
  Bishop
  Queen
  King
}

pub type Piece {
  Piece(team: team.Team, kind: PieceType)
}

pub fn to_string(piece: Piece) -> String {
  case piece.kind {
    Pawn -> "♟"
    Rook -> "♜"
    Knight -> "♞"
    Bishop -> "♝"
    Queen -> "♛"
    King -> "♚"
  }
}
