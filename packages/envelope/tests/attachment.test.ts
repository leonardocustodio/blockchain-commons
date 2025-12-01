import { Envelope, Attachments } from "../src";

describe("Attachment Extension", () => {
  describe("Create attachment envelope", () => {
    it("should create attachment with vendor and conformsTo", () => {
      const attachment = Envelope.newAttachment(
        "Custom data",
        "com.example",
        "https://example.com/format/v1"
      );

      expect(attachment.attachmentPayload().asText()).toBe("Custom data");
      expect(attachment.attachmentVendor()).toBe("com.example");
      expect(attachment.attachmentConformsTo()).toBe("https://example.com/format/v1");
    });
  });

  describe("Add attachment to envelope", () => {
    it("should add attachment to existing envelope", () => {
      const document = Envelope.new("User data")
        .addAssertion("name", "Alice")
        .addAttachment(
          "Vendor-specific metadata",
          "com.example",
          "https://example.com/metadata/v1"
        );

      expect(document.subject().asText()).toBe("User data");
      expect(document.assertions().length).toBeGreaterThan(1);

      const attachments = document.attachments();
      expect(attachments.length).toBe(1);
    });
  });

  describe("Multiple attachments", () => {
    it("should support multiple attachments", () => {
      const envelope = Envelope.new("Data")
        .addAttachment("Attachment 1", "com.example", "https://example.com/v1")
        .addAttachment("Attachment 2", "com.example", "https://example.com/v2")
        .addAttachment("Attachment 3", "com.other", "https://other.com/v1");

      expect(envelope.attachments().length).toBe(3);
    });
  });

  describe("Filter attachments", () => {
    it("should filter by vendor", () => {
      const envelope = Envelope.new("Data")
        .addAttachment("Attachment 1", "com.example", "https://example.com/v1")
        .addAttachment("Attachment 2", "com.example", "https://example.com/v2")
        .addAttachment("Attachment 3", "com.other", "https://other.com/v1");

      const exampleAttachments = envelope.attachmentsWithVendorAndConformsTo("com.example");
      expect(exampleAttachments.length).toBe(2);

      const otherAttachments = envelope.attachmentsWithVendorAndConformsTo("com.other");
      expect(otherAttachments.length).toBe(1);
    });

    it("should filter by conformsTo", () => {
      const envelope = Envelope.new("Data")
        .addAttachment("Attachment 1", "com.example", "https://example.com/v1")
        .addAttachment("Attachment 2", "com.example", "https://example.com/v2")
        .addAttachment("Attachment 3", "com.other", "https://other.com/v1");

      const v1Attachments = envelope.attachmentsWithVendorAndConformsTo(
        undefined,
        "https://example.com/v1"
      );
      expect(v1Attachments.length).toBe(1);
    });

    it("should filter by both vendor and conformsTo", () => {
      const envelope = Envelope.new("Data")
        .addAttachment("Attachment 1", "com.example", "https://example.com/v1")
        .addAttachment("Attachment 2", "com.example", "https://example.com/v2")
        .addAttachment("Attachment 3", "com.other", "https://other.com/v1");

      const specificAttachments = envelope.attachmentsWithVendorAndConformsTo(
        "com.example",
        "https://example.com/v2"
      );
      expect(specificAttachments.length).toBe(1);
    });
  });

  describe("Attachments container", () => {
    it("should manage multiple attachments", () => {
      const container = new Attachments();
      container.add("Data 1", "com.vendor1");
      container.add("Data 2", "com.vendor2", "https://vendor2.com/schema");
      container.add("Data 3", "com.vendor3");

      expect(container.isEmpty()).toBe(false);

      const base = Envelope.new("Base document");
      const withAttachments = container.addToEnvelope(base);

      expect(withAttachments.attachments().length).toBe(3);
    });

    it("should extract attachments from envelope", () => {
      const envelope = Envelope.new("Data")
        .addAttachment("Attachment 1", "com.example", "https://example.com/v1")
        .addAttachment("Attachment 2", "com.other", "https://other.com/v1");

      const extractedContainer = Attachments.fromEnvelope(envelope);

      expect(extractedContainer.isEmpty()).toBe(false);
    });
  });

  describe("Attachment without conformsTo", () => {
    it("should create attachment without conformsTo", () => {
      const simpleAttachment = Envelope.newAttachment("Simple data", "com.simple");

      expect(simpleAttachment.attachmentVendor()).toBe("com.simple");
      expect(simpleAttachment.attachmentConformsTo()).toBeUndefined();
    });
  });

  describe("Complex attachment payload", () => {
    it("should support envelope as payload", () => {
      const complexPayload = Envelope.new("Metadata")
        .addAssertion("version", "2.0")
        .addAssertion("timestamp", "2024-01-15T10:30:00Z");

      const complexAttachment = Envelope.new("Document")
        .addAttachment(complexPayload, "com.complex", "https://complex.com/v2");

      const attachments = complexAttachment.attachments();
      expect(attachments.length).toBe(1);
    });
  });
});
