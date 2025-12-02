import { flanked } from "../src";

describe("String Utilities", () => {
  describe("flanked function", () => {
    it("should wrap string with quotes", () => {
      expect(flanked("hello", '"', '"')).toBe('"hello"');
    });

    it("should wrap string with single quotes", () => {
      expect(flanked("name", "'", "'")).toBe("'name'");
    });

    it("should wrap string with brackets", () => {
      expect(flanked("item", "[", "]")).toBe("[item]");
    });

    it("should wrap string with braces", () => {
      expect(flanked("value", "{", "}")).toBe("{value}");
    });
  });

  describe("String.flankedBy extension", () => {
    it("should wrap with quotes using extension", () => {
      expect("world".flankedBy('"', '"')).toBe('"world"');
    });

    it("should wrap with single quotes using extension", () => {
      expect("Alice".flankedBy("'", "'")).toBe("'Alice'");
    });

    it("should wrap with angle brackets using extension", () => {
      expect("tag".flankedBy("<", ">")).toBe("<tag>");
    });
  });
});
