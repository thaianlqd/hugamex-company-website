# Phase 2 interface captures

2026-10-05. Public captures show the Supabase development preview through the normal Spring API. Authenticated CMS captures use isolated Docker QA content, not the Supabase owner's session. User email table cells are masked; no credentials or MFA setup are captured. Full-page screenshots include lazily loaded images after scrolling. See [verification scope](../../TEST_REPORT.md).

| Screen | Desktop | Mobile |
| --- | --- | --- |
| Home | [1440 px](public-home-1440.png) | [390 px](public-home-390.png) |
| About | [1440 px](public-about-1440.png) | [390 px](public-about-390.png) |
| Journal | [1440 px](public-news-1440.png) | [390 px](public-news-390.png) |
| Article | [1440 px](public-article-1440.png) | [390 px](public-article-390.png) |
| CMS login | [1440 px](admin-login-1440.png) | [390 px](admin-login-390.png) |
| Dashboard | [1440 px](admin-dashboard-1440.png) | [390 px](admin-dashboard-390.png) |
| Content list | [1440 px](admin-list-1440.png) | [390 px](admin-list-390.png) |
| Editor | [1440 px](admin-editor-1440.png) | [390 px](admin-editor-390.png) |
| Media | [1440 px](admin-media-1440.png) | [390 px](admin-media-390.png) |
| Users | [1440 px](admin-users-1440.png) | [390 px](admin-users-390.png) |

Additional captures: [mobile drawer](admin-drawer-mobile.png), [confirmation dialog](admin-confirm-dialog.png), [homepage panels](admin-homepage-desktop.png). Count-only machine reports: [public](read-only-smoke.json), [admin](admin-read-only-smoke.json), [seed](seed-summary.json).

## Company-profile/account refinement

| Screen | Desktop | Mobile |
| --- | --- | --- |
| Compact MFA | [1440 px](admin-mfa-1440.png) | [390 px](admin-mfa-390.png) |
| Personal information | [1440 px](admin-account-profile-1440.png) | [390 px](admin-account-profile-390.png) |
| Password change | [1440 px](admin-account-password-1440.png) | [390 px](admin-account-password-390.png) |
| MFA account settings | [1440 px](admin-account-security-1440.png) | [390 px](admin-account-security-390.png) |
| Factory network | [1440 px](public-network-1440.png) | [390 px](public-network-390.png) |
| Manufacturing | [1440 px](public-capabilities-1440.png) | [390 px](public-capabilities-390.png) |
| Contact | [1440 px](public-contact-1440.png) | [390 px](public-contact-390.png) |
| Quick contact popover | [1440 px](public-quick-contact-1440.png) | [390 px](public-quick-contact-390.png) |

Gray boxes in account screenshots intentionally mask QA email fields. No password/OTP/recovery code is entered in these captures. Contact values are company-profile business contacts supplied by the client, not owner credentials.
