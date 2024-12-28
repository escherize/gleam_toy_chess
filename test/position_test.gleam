import file.{A}
import gleeunit/should
import position
import rank

// gleeunit test functions end in `_test`
pub fn parse_string_test() {
  position.parse("A1")
  |> should.be_ok

  position.parse("A1")
  |> should.equal(position.new(Ok(A), rank.new(1)))
}
// TODO: it goes FILE then RANK !!!
