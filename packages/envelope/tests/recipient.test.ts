import { Envelope, PrivateKeyBase, SymmetricKey, HAS_RECIPIENT } from "../src";

describe("Recipient (Public-Key Encryption)", () => {
  describe("Key generation", () => {
    it("should generate key pairs", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();

      expect(alice.publicKeys().hex().length).toBeGreaterThan(0);
      expect(bob.publicKeys().hex().length).toBeGreaterThan(0);
    });
  });

  describe("Single-recipient encryption", () => {
    it("should encrypt for single recipient", async () => {
      const bob = await PrivateKeyBase.generate();
      const message = Envelope.new("Secret message for Bob");

      const encrypted = await message.encryptSubjectToRecipient(bob.publicKeys());

      expect(encrypted.subject().case().type).toBe("encrypted");
      expect(encrypted.assertions().length).toBeGreaterThan(0);
    });

    it("should decrypt for intended recipient", async () => {
      const bob = await PrivateKeyBase.generate();
      const message = Envelope.new("Secret message for Bob");

      const encrypted = await message.encryptSubjectToRecipient(bob.publicKeys());
      const decrypted = await encrypted.decryptSubjectToRecipient(bob);

      expect(decrypted.subject().asText()).toBe("Secret message for Bob");
    });
  });

  describe("Wrong recipient", () => {
    it("should fail decryption for wrong recipient", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();
      const message = Envelope.new("Secret message for Bob");

      const encrypted = await message.encryptSubjectToRecipient(bob.publicKeys());

      await expect(encrypted.decryptSubjectToRecipient(alice)).rejects.toThrow();
    });
  });

  describe("Multi-recipient encryption", () => {
    it("should encrypt for multiple recipients", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();
      const charlie = await PrivateKeyBase.generate();

      const message = Envelope.new("Secret for Alice, Bob, and Charlie");
      const encrypted = await message.encryptSubjectToRecipients([
        alice.publicKeys(),
        bob.publicKeys(),
        charlie.publicKeys(),
      ]);

      expect(encrypted.recipients().length).toBe(3);
      expect(encrypted.subject().case().type).toBe("encrypted");
    });

    it("should allow all recipients to decrypt", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();
      const charlie = await PrivateKeyBase.generate();

      const message = Envelope.new("Secret for all");
      const encrypted = await message.encryptSubjectToRecipients([
        alice.publicKeys(),
        bob.publicKeys(),
        charlie.publicKeys(),
      ]);

      const aliceDecrypted = await encrypted.decryptSubjectToRecipient(alice);
      const bobDecrypted = await encrypted.decryptSubjectToRecipient(bob);
      const charlieDecrypted = await encrypted.decryptSubjectToRecipient(charlie);

      expect(aliceDecrypted.subject().asText()).toBe("Secret for all");
      expect(bobDecrypted.subject().asText()).toBe("Secret for all");
      expect(charlieDecrypted.subject().asText()).toBe("Secret for all");
    });
  });

  describe("Adding recipients incrementally", () => {
    it("should add recipients one at a time", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();
      const dave = await PrivateKeyBase.generate();

      const message = Envelope.new("Secret message");
      const contentKey = await SymmetricKey.generate();

      const baseEncrypted = await message.encryptSubject(contentKey);
      const withAlice = await baseEncrypted.addRecipient(alice.publicKeys(), contentKey);
      const withBob = await withAlice.addRecipient(bob.publicKeys(), contentKey);
      const withDave = await withBob.addRecipient(dave.publicKeys(), contentKey);

      expect(withDave.recipients().length).toBe(3);

      const aliceDecrypted = await withDave.decryptSubjectToRecipient(alice);
      const daveDecrypted = await withDave.decryptSubjectToRecipient(dave);

      expect(aliceDecrypted.subject().asText()).toBe("Secret message");
      expect(daveDecrypted.subject().asText()).toBe("Secret message");
    });
  });

  describe("Entire envelope encryption", () => {
    it("should encrypt entire envelope to recipients", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();

      const document = Envelope.new("Contract terms and conditions");

      const encrypted = await document.encryptToRecipients([alice.publicKeys(), bob.publicKeys()]);

      expect(encrypted.recipients().length).toBe(2);

      const aliceDoc = await encrypted.decryptToRecipient(alice);
      const bobDoc = await encrypted.decryptToRecipient(bob);

      expect(aliceDoc.subject().asText()).toBe("Contract terms and conditions");
      expect(bobDoc.subject().asText()).toBe("Contract terms and conditions");
    });
  });

  describe("Key serialization", () => {
    it("should serialize and restore keys", async () => {
      const alice = await PrivateKeyBase.generate();

      const privateHex = alice.hex();
      const publicHex = alice.publicKeys().hex();

      const restored = await PrivateKeyBase.fromHex(privateHex, publicHex);

      const message = Envelope.new("Test serialization");
      const encrypted = await message.encryptSubjectToRecipient(restored.publicKeys());
      const decrypted = await encrypted.decryptSubjectToRecipient(restored);

      expect(decrypted.subject().asText()).toBe("Test serialization");
    });
  });

  describe("HAS_RECIPIENT constant", () => {
    it("should have expected value", () => {
      expect(HAS_RECIPIENT).toBe("hasRecipient");
    });
  });

  describe("Large payload encryption", () => {
    it("should handle large payloads", async () => {
      const alice = await PrivateKeyBase.generate();
      const bob = await PrivateKeyBase.generate();

      const largeData = "X".repeat(10000);
      const largeEnvelope = Envelope.new(largeData);

      const encrypted = await largeEnvelope.encryptSubjectToRecipients([
        alice.publicKeys(),
        bob.publicKeys(),
      ]);

      const decrypted = await encrypted.decryptSubjectToRecipient(alice);

      expect(decrypted.subject().asText().length).toBe(largeData.length);
    });
  });
});
