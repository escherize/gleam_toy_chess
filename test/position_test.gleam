import file
import gleeunit
import gleeunit/should
import position
import rank

// gleeunit test functions end in `_test`
pub fn parse_string_test() {
  position.from_string("A1")
  |> should.be_ok
  |> should.equal(position.new(rank.from_int(1), file.A))
}
// TODO: it goes FILE then RANK !!!
