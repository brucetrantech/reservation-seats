# User Stories & Acceptance Criteria

## Epic 1: Authentication

### US-1.1: Google OAuth Login

**As a** user,  
**I want to** sign in using my Google account,  
**So that** I can access the seat reservation system without creating a separate account.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User clicks "Login with Google" and is redirected to Google consent screen | Must |
| AC-2 | After granting consent, user is redirected back with a valid session | Must |
| AC-3 | User's name, email, and avatar are stored in the system | Must |
| AC-4 | JWT access token (15m) and refresh token (90d) are issued as httpOnly cookies | Must |
| AC-5 | If the user already exists, their profile is updated (not duplicated) | Must |
| AC-6 | If Google auth fails, user sees a clear error message on the login page | Should |

### US-1.2: Session Management

**As a** logged-in user,  
**I want to** stay authenticated across page refreshes,  
**So that** I don't have to log in repeatedly.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Access token is refreshed automatically before expiry via refresh token | Must |
| AC-2 | If refresh token is expired/revoked, user is redirected to login | Must |
| AC-3 | User can manually logout, which revokes the refresh token | Must |
| AC-4 | After logout, all cookies are cleared and user is returned to login page | Must |

### US-1.3: View Profile

**As a** logged-in user,  
**I want to** see my profile information (name, email, avatar),  
**So that** I can confirm I'm logged into the correct account.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Profile endpoint returns user's id, name, email, and avatar URL | Must |
| AC-2 | Unauthenticated requests to profile return 401 Unauthorized | Must |

---

## Epic 2: Seat Browsing

### US-2.1: View Available Seats

**As a** user (authenticated or not),  
**I want to** see all seats and their current status,  
**So that** I can decide which seat to reserve.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Seats page displays all 3 seats in a grid layout | Must |
| AC-2 | Each seat shows its number and status (available / held / reserved) | Must |
| AC-3 | Available seats are visually distinct from held/reserved seats | Must |
| AC-4 | Seat list refreshes to reflect real-time availability changes | Should |
| AC-5 | The endpoint is publicly accessible (no auth required) | Must |

### US-2.2: View Seat Details

**As a** user,  
**I want to** click on a seat to view its details,  
**So that** I can see the price and reservation information.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Seat detail page shows seat number, price (50,000 VND), and status | Must |
| AC-2 | If seat is available and user is authenticated, a "Reserve" button is shown | Must |
| AC-3 | If seat is held/reserved, user sees a status indicator (no action available) | Must |
| AC-4 | If user is not authenticated, they are prompted to log in before reserving | Must |

---

## Epic 3: Seat Reservation (Hold)

### US-3.1: Hold a Seat

**As an** authenticated user,  
**I want to** hold an available seat,  
**So that** I have time (5 minutes) to complete the payment.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User can hold a seat that is currently "available" | Must |
| AC-2 | Seat status changes to "held" immediately upon successful hold | Must |
| AC-3 | A booking record is created with status "pending" | Must |
| AC-4 | Hold duration is 5 minutes (configurable via env variable) | Must |
| AC-5 | If seat is already held/reserved, user receives a 409 Conflict error | Must |
| AC-6 | Concurrent hold requests for the same seat are serialized (pessimistic lock) | Must |
| AC-7 | User is redirected to the payment page after successful hold | Must |

### US-3.2: Automatic Hold Expiry

**As the** system,  
**I want to** automatically release expired holds,  
**So that** seats don't remain locked indefinitely.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | A cron job runs every minute to check for expired holds | Must |
| AC-2 | Expired holds reset the seat status to "available" | Must |
| AC-3 | The associated booking status changes to "expired" | Should |
| AC-4 | If a user tries to pay after hold expires, they receive a clear error | Must |

### US-3.3: Cancel Hold

**As an** authenticated user,  
**I want to** cancel my pending hold,  
**So that** the seat becomes available for others.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User can cancel a booking they own that is in "pending" status | Must |
| AC-2 | Cancellation releases the seat back to "available" | Must |
| AC-3 | Booking status changes to "cancelled" | Must |
| AC-4 | User cannot cancel a booking that is already confirmed/expired/cancelled | Must |

---

## Epic 4: Payment

### US-4.1: Pay for Reserved Seat (Mock Payment)

**As an** authenticated user,  
**I want to** complete payment using the mock payment method,  
**So that** I can quickly confirm my reservation during testing/demos.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User selects "Quick Pay (Demo)" on the payment page | Must |
| AC-2 | Payment is processed immediately without external redirect | Must |
| AC-3 | Payment verification validates txnRef, amount, and booking ownership | Must |
| AC-4 | On success: payment status → "success", booking → "confirmed", seat → "reserved" | Must |
| AC-5 | User is redirected to the confirmation page with booking details | Must |
| AC-6 | If verification fails, payment is marked "failed" and user sees an error | Must |

### US-4.2: Pay for Reserved Seat (Napas/VNPay)

**As an** authenticated user,  
**I want to** pay via Napas/VNPay payment gateway,  
**So that** I can use a real banking payment method.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User selects "Napas / VNPay" on the payment page | Must |
| AC-2 | System generates a secure payment URL with HMAC-SHA512 signature | Must |
| AC-3 | User is redirected to the Napas payment gateway | Must |
| AC-4 | On successful return, signature is verified and booking is confirmed | Must |
| AC-5 | On failed return, booking remains pending and user sees error message | Must |
| AC-6 | IPN webhook updates payment status independently of user return | Must |
| AC-7 | Duplicate IPN calls are idempotent (already-confirmed payments return "02") | Must |

### US-4.3: Payment Countdown

**As a** user on the payment page,  
**I want to** see a countdown timer showing remaining hold time,  
**So that** I know how much time I have to complete the payment.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Countdown timer displays minutes:seconds remaining | Must |
| AC-2 | Timer starts from the booking's hold expiry time | Must |
| AC-3 | When timer reaches 0, user is notified that the hold expired | Must |
| AC-4 | Pay button is disabled after timer expires | Should |

---

## Epic 5: Notifications

### US-5.1: Email Confirmation

**As a** user who completed payment,  
**I want to** receive an email confirmation with a PDF ticket,  
**So that** I have proof of my reservation.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | Confirmation email is sent to the user's registered email | Must |
| AC-2 | Email contains: user name, seat number, booking ID, transaction number | Must |
| AC-3 | Email has an attached PDF ticket with reservation details | Must |
| AC-4 | PDF ticket includes: seat number, booking ID, date, and a styled layout | Must |
| AC-5 | Email sending is non-blocking (fire-and-forget) | Must |
| AC-6 | If email fails, the booking is NOT rolled back | Must |

---

## Epic 6: System Health

### US-6.1: Health Check

**As a** system operator,  
**I want to** verify the API is running via a health endpoint,  
**So that** monitoring tools can detect outages.

**Acceptance Criteria:**

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | GET /health returns 200 with { status: 'ok' } | Must |
| AC-2 | Endpoint is publicly accessible (no auth required) | Must |

---

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | API response time for seat listing | < 200ms (p95) |
| NFR-2 | Payment confirmation transaction | < 500ms (p95) |
| NFR-3 | Hold expiry accuracy | Within 60 seconds of expiry time |
| NFR-4 | Concurrent hold requests on same seat | Only 1 succeeds (serialized) |
| NFR-5 | System availability | 99.9% uptime (SLA target) |
| NFR-6 | Data integrity | No double-bookings under any race condition |
| NFR-7 | Security | All tokens httpOnly, CORS restricted, input validated |
