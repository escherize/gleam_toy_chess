import team

pub type PieceKind {
  Pawn
  Rook
  Knight
  Bishop
  Queen
  King
}

pub type Piece {
  Piece(team: team.Team, kind: PieceKind)
}

pub fn new(team: team.Team, kind: PieceKind) -> Piece {
  Piece(team: team, kind: kind)
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
