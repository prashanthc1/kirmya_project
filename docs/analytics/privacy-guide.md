# Kirmya Privacy-Preserving Analytics & Group Anonymization Manual

## 1. Analytics Privacy & Group Protection Rules
- **Minimum Group Size Threshold (`k=5`)**: Aggregate queries with fewer than 5 matching records are masked or grouped into 'Other' to prevent deanonymization.
- **User Consent Verification**: Optional product analytics events are dropped if the user has disabled analytics tracking in privacy settings.
- **Protected Attribute Shielding**: Demographic and sensitive attributes are strictly barred from analytics collection and segmentation.
