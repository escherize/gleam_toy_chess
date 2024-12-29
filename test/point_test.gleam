import gleeunit/should
import point

fn parse_test(in, expected) {
  in
  |> point.parse
  |> should.be_ok
  |> should.equal(expected)
}

pub fn parse_point_test() {
  let assert Ok(a1) = point.new(1, 1)

  parse_test("A1", a1)
  parse_test("a1", a1)

  let assert Ok(h3) = point.new(8, 3)
  parse_test("H3", h3)
  parse_test("h3", h3)
}
