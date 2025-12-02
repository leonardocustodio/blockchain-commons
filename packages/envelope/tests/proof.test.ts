import { Envelope } from "../src";

describe("Proofs (Inclusion Proofs)", () => {
  describe("Basic inclusion proof", () => {
    it("should create envelope with assertions", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol")
        .addAssertion("knows", "Dan");

      expect(aliceFriends.subject().asText()).toBe("Alice");
      expect(aliceFriends.assertions().length).toBe(3);
    });
  });

  describe("Trusted root digest", () => {
    it("should create elided root", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol");

      const root = aliceFriends.elideRevealingSet(new Set());

      expect(root.subject().case().type).toBe("elided");
    });
  });

  describe("Proof for single assertion", () => {
    it("should create and verify proof", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol");

      const root = aliceFriends.elideRevealingSet(new Set());
      const knowsBobAssertion = Envelope.newAssertion("knows", "Bob");
      const proof = aliceFriends.proofContainsTarget(knowsBobAssertion);

      expect(proof).toBeDefined();
      if (proof) {
        expect(proof.digest().hex()).toBe(aliceFriends.digest().hex());
        expect(root.confirmContainsTarget(knowsBobAssertion, proof)).toBe(true);
      }
    });
  });

  describe("Proof for non-existent assertion", () => {
    it("should return undefined for non-existent target", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol");

      const knowsEveAssertion = Envelope.newAssertion("knows", "Eve");
      const proof = aliceFriends.proofContainsTarget(knowsEveAssertion);

      expect(proof).toBeUndefined();
    });
  });

  describe("Verification with wrong assertion", () => {
    it("should fail verification with wrong assertion", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol");

      const root = aliceFriends.elideRevealingSet(new Set());
      const knowsBobAssertion = Envelope.newAssertion("knows", "Bob");
      const knowsEveAssertion = Envelope.newAssertion("knows", "Eve");
      const proof = aliceFriends.proofContainsTarget(knowsBobAssertion);

      if (proof) {
        expect(root.confirmContainsTarget(knowsEveAssertion, proof)).toBe(false);
      }
    });
  });

  describe("Multi-assertion proof", () => {
    it("should create and verify multi-assertion proof", () => {
      const aliceFriends = Envelope.new("Alice")
        .addAssertion("knows", "Bob")
        .addAssertion("knows", "Carol")
        .addAssertion("knows", "Dan");

      const root = aliceFriends.elideRevealingSet(new Set());
      const knowsBob = Envelope.newAssertion("knows", "Bob");
      const knowsCarol = Envelope.newAssertion("knows", "Carol");

      const targetSet = new Set([knowsBob.digest(), knowsCarol.digest()]);
      const multiProof = aliceFriends.proofContainsSet(targetSet);

      expect(multiProof).toBeDefined();
      if (multiProof) {
        expect(root.confirmContainsSet(targetSet, multiProof)).toBe(true);
      }
    });
  });

  describe("Credential with selective disclosure", () => {
    it("should create proof for credential attribute", () => {
      const credential = Envelope.new("Credential")
        .addAssertion("firstName", "John")
        .addAssertion("lastName", "Smith")
        .addAssertion("birthDate", "1990-01-01")
        .addAssertion("address", "123 Main St");

      const root = credential.elideRevealingSet(new Set());
      const addressAssertion = Envelope.newAssertion("address", "123 Main St");
      const addressProof = credential.proofContainsTarget(addressAssertion);

      expect(addressProof).toBeDefined();
      if (addressProof) {
        expect(root.confirmContainsTarget(addressAssertion, addressProof)).toBe(true);
      }
    });
  });

  describe("Proof of subject", () => {
    it("should create proof for subject", () => {
      const credential = Envelope.new("Credential").addAssertion("firstName", "John");

      const root = credential.elideRevealingSet(new Set());
      const subjectProof = credential.proofContainsTarget(Envelope.new("Credential"));

      expect(subjectProof).toBeDefined();
      if (subjectProof) {
        expect(root.confirmContainsTarget(Envelope.new("Credential"), subjectProof)).toBe(true);
      }
    });
  });

  describe("Wrapped envelope proof", () => {
    it("should create proof for wrapped envelope", () => {
      const wrapped = Envelope.new("Secret Data").wrap();
      const root = wrapped.elideRevealingSet(new Set());
      const target = Envelope.new("Secret Data");
      const proof = wrapped.proofContainsTarget(target);

      expect(proof).toBeDefined();
      if (proof) {
        expect(root.confirmContainsTarget(target, proof)).toBe(true);
      }
    });
  });

  describe("Proof digest consistency", () => {
    it("should have consistent digests", () => {
      const aliceFriends = Envelope.new("Alice").addAssertion("knows", "Bob");

      const root = aliceFriends.elideRevealingSet(new Set());
      const knowsBob = Envelope.newAssertion("knows", "Bob");
      const proof = aliceFriends.proofContainsTarget(knowsBob);

      if (proof) {
        expect(aliceFriends.digest().hex()).toBe(proof.digest().hex());
        expect(proof.digest().hex()).toBe(root.digest().hex());
      }
    });
  });

  describe("Empty target set", () => {
    it("should handle empty target set", () => {
      const aliceFriends = Envelope.new("Alice").addAssertion("knows", "Bob");

      const root = aliceFriends.elideRevealingSet(new Set());
      const emptySet = new Set<ReturnType<typeof Envelope.prototype.digest>>();
      const proof = aliceFriends.proofContainsSet(emptySet);

      expect(proof).toBeDefined();
      if (proof) {
        expect(root.confirmContainsSet(emptySet, proof)).toBe(true);
      }
    });
  });

  describe("Proof verification with mismatched root", () => {
    it("should fail verification with different root", () => {
      const aliceFriends = Envelope.new("Alice").addAssertion("knows", "Bob");

      const differentRoot = Envelope.new("Bob").elideRevealingSet(new Set());
      const knowsBob = Envelope.newAssertion("knows", "Bob");
      const proof = aliceFriends.proofContainsTarget(knowsBob);

      if (proof) {
        expect(differentRoot.confirmContainsTarget(knowsBob, proof)).toBe(false);
      }
    });
  });
});
