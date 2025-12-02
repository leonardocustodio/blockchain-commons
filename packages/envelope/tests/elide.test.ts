import { Envelope } from "../src";

describe("Elision Extension", () => {
  describe("Basic elision", () => {
    it("should elide envelope and preserve digest", () => {
      const envelope = Envelope.new("Secret message");
      const elided = envelope.elide();

      expect(envelope.digest().equals(elided.digest())).toBe(true);
      expect(elided.case().type).toBe("elided");
    });
  });

  describe("Selective elision", () => {
    it("should elide specific assertions", () => {
      const person = Envelope.new("Alice")
        .addAssertion("name", "Alice Smith")
        .addAssertion("age", 30)
        .addAssertion("ssn", "123-45-6789");

      const assertions = person.assertions();
      const ssnAssertion = assertions.find((a) => {
        const c = a.case();
        if (c.type === "assertion") {
          const pred = c.assertion.predicate();
          if (pred.case().type === "leaf") {
            try {
              return pred.asText() === "ssn";
            } catch {
              return false;
            }
          }
        }
        return false;
      });

      if (ssnAssertion) {
        const targetSet = new Set([ssnAssertion.digest()]);
        const redacted = person.elideRemovingSet(targetSet);

        expect(person.digest().equals(redacted.digest())).toBe(true);
      }
    });
  });

  describe("Reveal specific elements", () => {
    it("should reveal only specified elements", () => {
      const person = Envelope.new("Alice")
        .addAssertion("name", "Alice Smith")
        .addAssertion("age", 30)
        .addAssertion("ssn", "123-45-6789");

      const assertions = person.assertions();
      const nameAssertion = assertions.find((a) => {
        const c = a.case();
        if (c.type === "assertion") {
          const pred = c.assertion.predicate();
          if (pred.case().type === "leaf") {
            try {
              return pred.asText() === "name";
            } catch {
              return false;
            }
          }
        }
        return false;
      });

      if (nameAssertion) {
        const revealSet = new Set([person.subject().digest(), nameAssertion.digest()]);

        const selective = person.elideRevealingSet(revealSet);

        expect(person.digest().equals(selective.digest())).toBe(true);
      }
    });
  });

  describe("Elide multiple assertions", () => {
    it("should elide multiple targets using array", () => {
      const person = Envelope.new("Alice")
        .addAssertion("name", "Alice Smith")
        .addAssertion("age", 30)
        .addAssertion("ssn", "123-45-6789");

      const targets = person.assertions().slice(1, 3);
      const multiElided = person.elideRemovingArray(targets);

      expect(person.digest().equals(multiElided.digest())).toBe(true);
    });
  });

  describe("Un-elide / reveal", () => {
    it("should un-elide with original envelope", () => {
      const envelope = Envelope.new("Secret message");
      const elided = envelope.elide();

      const revealed = elided.unelide(envelope);

      expect(revealed.digest().equals(envelope.digest())).toBe(true);
      expect(revealed.asText()).toBe("Secret message");
    });
  });

  describe("Identity check", () => {
    it("should identify identical envelopes", () => {
      const env1 = Envelope.new("Hello");
      const env2 = Envelope.new("Hello");
      const wrapped = env1.wrap();

      expect(env1.isIdenticalTo(env2)).toBe(true);
      expect(env1.isIdenticalTo(wrapped)).toBe(false);
    });
  });

  describe("Nested elision", () => {
    it("should elide nested envelope assertions", () => {
      const company = Envelope.new("Company")
        .addAssertion("name", "ACME Corp")
        .addAssertion(
          "CEO",
          Envelope.new("Bob").addAssertion("age", 45).addAssertion("email", "bob@acme.com"),
        );

      const ceoAssertion = company.assertions().find((a) => {
        const c = a.case();
        if (c.type === "assertion") {
          const pred = c.assertion.predicate();
          if (pred.case().type === "leaf") {
            try {
              return pred.asText() === "CEO";
            } catch {
              return false;
            }
          }
        }
        return false;
      });

      if (ceoAssertion) {
        const nestedElided = company.elideRemovingTarget(ceoAssertion);

        expect(company.digest().equals(nestedElided.digest())).toBe(true);
      }
    });
  });
});
