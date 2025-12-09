/**
 * @blockchain-commons/xid - XID Document Library
 *
 * TypeScript implementation of Blockchain Commons' XID specification
 * for eXtensible IDentifiers and XID Documents.
 *
 * Ported from bc-xid-rust
 */

// Error handling
export { XIDError, XIDErrorCode, type XIDResult } from "./error.js";

// Privilege system
export {
  Privilege,
  privilegeToKnownValue,
  privilegeFromKnownValue,
  privilegeToEnvelope,
  privilegeFromEnvelope,
} from "./privilege.js";

// Permissions
export { Permissions, type HasPermissions, HasPermissionsMixin } from "./permissions.js";

// Name/Nickname
export { type HasNickname, HasNicknameMixin } from "./name.js";

// Shared reference wrapper
export { Shared } from "./shared.js";

// Key types
export {
  Key,
  XIDPrivateKeyOptions,
  type XIDPrivateKeyEncryptConfig,
  type XIDPrivateKeyOptionsValue,
  type PrivateKeyData,
} from "./key.js";

// Service
export { Service } from "./service.js";

// Delegate
export { Delegate, registerXIDDocumentClass } from "./delegate.js";

// Provenance
export {
  Provenance,
  XIDGeneratorOptions,
  type XIDGeneratorEncryptConfig,
  type XIDGeneratorOptionsValue,
  type GeneratorData,
} from "./provenance.js";

// XID Document (main export)
export {
  XIDDocument,
  type XIDInceptionKeyOptions,
  type XIDGenesisMarkOptions,
  type XIDSigningOptions,
  XIDVerifySignature,
} from "./xid-document.js";

// Version information
export const VERSION = "1.0.0-alpha.3";
