import { Envelope } from "../src";

describe("Compression Extension", () => {
  describe("Basic compression", () => {
    it("should compress large text content", () => {
      const lorem =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(
          5,
        );
      const envelope = Envelope.new(lorem);
      const originalSize = envelope.cborBytes().length;

      const compressed = envelope.compress();
      const compressedSize = compressed.cborBytes().length;

      expect(compressedSize).toBeLessThan(originalSize);
      expect(envelope.digest().equals(compressed.digest())).toBe(true);
      expect(compressed.isCompressed()).toBe(true);
    });
  });

  describe("Decompression", () => {
    it("should decompress to original content", () => {
      const lorem =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(
          5,
        );
      const envelope = Envelope.new(lorem);

      const compressed = envelope.compress();
      const decompressed = compressed.decompress();

      expect(decompressed.digest().equals(envelope.digest())).toBe(true);
      expect(decompressed.asText()).toBe(lorem);
      expect(decompressed.isCompressed()).toBe(false);
    });
  });

  describe("Double compression", () => {
    it("should return same envelope on double compress", () => {
      const lorem = "Lorem ipsum dolor sit amet. ".repeat(10);
      const envelope = Envelope.new(lorem);

      const compressed = envelope.compress();
      const doubleCompressed = compressed.compress();

      expect(doubleCompressed).toBe(compressed);
    });
  });

  describe("Compression with assertions", () => {
    it("should compress envelope with assertions", () => {
      const withAssertions = Envelope.new("Subject")
        .addAssertion("key1", "A".repeat(100))
        .addAssertion("key2", "B".repeat(100))
        .addAssertion("key3", "C".repeat(100));

      const compressed = withAssertions.compress();
      const decompressed = compressed.decompress();

      expect(decompressed.digest().equals(withAssertions.digest())).toBe(true);
    });
  });

  describe("Subject-only compression", () => {
    it("should compress only the subject", () => {
      const largeSubject = Envelope.new("X".repeat(200))
        .addAssertion("note", "Small metadata")
        .addAssertion("tag", "important");

      const subjectCompressed = largeSubject.compressSubject();

      expect(subjectCompressed.subject().isCompressed()).toBe(true);
      expect(subjectCompressed.digest().equals(largeSubject.digest())).toBe(true);
      expect(subjectCompressed.assertions().length).toBe(2);
    });
  });

  describe("Subject decompression", () => {
    it("should decompress subject", () => {
      const largeSubject = Envelope.new("X".repeat(200)).addAssertion("note", "Small metadata");

      const subjectCompressed = largeSubject.compressSubject();
      const subjectDecompressed = subjectCompressed.decompressSubject();

      expect(subjectDecompressed.subject().isCompressed()).toBe(false);
      expect(subjectDecompressed.digest().equals(largeSubject.digest())).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should throw error when decompressing non-compressed envelope", () => {
      const envelope = Envelope.new("Not compressed");

      expect(() => envelope.decompress()).toThrow();
    });
  });

  describe("Nested envelope compression", () => {
    it("should compress nested envelopes", () => {
      const nested = Envelope.new("Alice")
        .addAssertion(
          "profile",
          Envelope.new("Profile data: " + "Y".repeat(100)).addAssertion("bio", "Z".repeat(100)),
        )
        .addAssertion("settings", "W".repeat(100));

      const compressed = nested.compress();
      const decompressed = compressed.decompress();

      expect(decompressed.digest().equals(nested.digest())).toBe(true);
    });
  });
});
