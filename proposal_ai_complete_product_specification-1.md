# Proposal AI --- Complete Product Requirements & Feature Specification

**Product type:** AI-powered proposal generation and business management
SaaS\
**Working name:** Proposal AI\
**Primary market:** Freelancers, consultants, agencies, service
businesses and companies\
**Document status:** Product blueprint / build specification\
**Currency examples:** Nigerian naira (₦); the platform must support
configurable currencies.

------------------------------------------------------------------------

## 1. Product vision

Proposal AI is a business platform that helps a service provider move
from a prospective client to a signed proposal, quotation, payment,
project delivery and business performance review.

It is not merely a document generator. Its AI should behave like a
thoughtful business development consultant: understand the user's
business and the prospective client's needs, identify missing
information, ask useful questions, recommend relevant services and
features, explain the value of the proposed work, and help produce a
persuasive, accurate proposal.

The platform combines:

1.  Business profile and brand setup
2.  Services and pricing catalogue
3.  AI proposal strategist and discovery workflow
4.  Multi-page proposal builder
5.  Proposal comparison tables and recommendations
6.  Quotation generator
7.  Receipt generator
8.  Client CRM
9.  Proposal acceptance token and approval workflow
10. Project and progress tracker
11. Financial dashboard
12. Business and proposal analytics
13. Client portal
14. Document templates, export and sharing
15. Notifications, reminders and activity history
16. Subscription plans and platform administration

### Core product promise

**Understand the opportunity. Build a stronger proposal. Win the client.
Track the work. Manage the money.**

------------------------------------------------------------------------

## 2. User types and permissions

### 2.1 Platform owner / SaaS administrator

Manages the SaaS itself:

-   Manage user accounts and subscriptions.
-   Configure plan limits and feature access.
-   View platform-wide usage and operational analytics.
-   Manage AI providers, model routing and usage limits.
-   Review abuse reports and support requests.
-   Configure global document defaults and system settings.
-   View payment and subscription transaction records.

Platform administrators must not casually access private business
documents. Administrative access to customer content should be
restricted, permissioned and audited.

### 2.2 Business owner

The primary account holder:

-   Creates and manages the business profile.
-   Adds services, products, packages and prices.
-   Creates clients, proposals, quotations and receipts.
-   Controls discounts, taxes, payment terms and document settings.
-   Invites team members where the plan allows.
-   Assigns projects and tracks progress.
-   Views financial and performance dashboards.
-   Controls client portal access.

### 2.3 Team member

Permissions are configurable by the business owner:

-   View or manage assigned clients.
-   Create drafts of proposals and quotations.
-   Update assigned project tasks.
-   Record payments, where authorized.
-   View selected reports.
-   Cannot change ownership, subscription or sensitive settings unless
    granted permission.

### 2.4 Client

A client may access a secure portal through an invitation or proposal
acceptance link:

-   View the proposal and quotation shared with them.
-   Compare packages.
-   Ask questions or submit feedback.
-   Accept or decline a proposal.
-   Sign or confirm acceptance where enabled.
-   View project milestones and approved progress updates.
-   View invoices, receipts and payment history shared with them.
-   Download permitted documents.

A client must only see information belonging to their own client account
and projects.

------------------------------------------------------------------------

## 3. First-time onboarding and business profiling

A user must complete a guided business profile before generating a fully
branded proposal. Allow saving progress and returning later.

### 3.1 Business identity

Fields:

-   Business or company name
-   Business logo
-   Short business description
-   Industry and business category
-   Business address and operating location
-   Contact person's name
-   Business email and phone number
-   Website URL
-   Social media links
-   Years in operation
-   Registration details (optional)
-   Tax identification details (optional and configurable by country)

### 3.2 Brand identity

-   Upload logo in suitable formats.
-   Set primary, secondary and accent colours.
-   Select typography and document style.
-   Upload letterhead or branded assets.
-   Add authorized signature image.
-   Add company stamp or seal image.
-   Configure footer, contact details and page numbering.
-   Preview branding on a sample proposal, quotation and receipt.

### 3.3 Business profile and positioning

-   What the business does
-   Who it serves
-   Main customer types
-   Geographic service area
-   Main differentiators
-   Business mission or positioning statement
-   Typical project size
-   Preferred tone of communication
-   Common client problems solved

### 3.4 Portfolio and credibility library

Allow users to upload and organize:

-   Portfolio projects
-   Project screenshots and images
-   Case studies
-   Client testimonials
-   Client logos, where permission exists
-   Awards
-   Certifications
-   Team biographies
-   Relevant qualifications
-   Published work and references
-   Before-and-after examples

Each item should have a title, description, category, date, optional
result/metric, visibility setting and file attachments.

**AI evidence rule:** The AI may use only information supplied by the
user or verified through an explicitly enabled research workflow. It
must not invent clients, testimonials, awards, experience, results,
certifications or performance claims.

------------------------------------------------------------------------

## 4. Services, products, packages and pricing catalogue

Users should configure their offerings once and reuse them across
proposals and quotations.

### 4.1 Service or product fields

-   Name
-   Category
-   Description
-   Detailed scope
-   Deliverables
-   Features and specifications
-   Unit of measurement
-   Default quantity
-   Base price
-   Optional price range
-   Estimated delivery duration
-   Optional add-ons
-   Exclusions
-   Warranty or support period
-   Tax treatment
-   Active / archived status

### 4.2 Packages

Users can create reusable packages such as Basic, Professional and
Enterprise.

For each package:

-   Package name and description
-   Included services
-   Included features
-   Limits or quantities
-   Delivery timeline
-   Support period
-   Price
-   Optional add-ons
-   Recommended / popular designation
-   Terms and exclusions

### 4.3 Pricing controls

-   Fixed pricing
-   Quantity-based pricing
-   Hourly or daily rates
-   Milestone pricing
-   Custom one-off pricing
-   Recurring service pricing
-   Optional add-ons
-   Discounts by amount or percentage
-   Tax and levy configuration
-   Delivery or setup fees
-   Deposit and instalment settings

The application, not the AI, must calculate all totals. Use decimal-safe
arithmetic and store currency codes with amounts. Never use
floating-point arithmetic for financial calculations.

------------------------------------------------------------------------

## 5. AI Proposal Strategist

This is the central differentiating feature.

### 5.1 Opportunity intake

The user enters information about the prospective client:

-   Client or company name
-   Industry and business category
-   What the client does
-   Website or public profile (optional)
-   Contact person's name and role
-   Location
-   Known business goals
-   Known challenges
-   How the opportunity was discovered
-   Any conversation notes or uploaded brief

The user then describes the proposed service and the reason for
approaching the client.

### 5.2 AI discovery and analysis

The AI should combine:

-   User's business profile
-   Service catalogue and package details
-   Portfolio and credibility library
-   Prospective client's supplied information
-   Project brief and conversation notes
-   User's desired outcome
-   Pricing rules and delivery capacity

It should identify:

-   What the client likely needs based on supplied evidence
-   What is unclear or missing
-   Potential risks and assumptions
-   Relevant services the user can actually provide
-   Features that may improve the solution
-   Optional upgrades
-   Likely client concerns or objections
-   Information required to price and scope accurately

If external research is enabled, the AI must distinguish researched
facts from user-provided claims and cite or link the sources in its
internal research notes. It must not imply that it accessed private
client information.

### 5.3 Adaptive question generation

Instead of asking every user the same questions, generate questions
based on the opportunity.

Question examples for a website project:

-   What is the primary purpose of the website?
-   Does the client need a corporate website, marketplace, booking
    platform or web application?
-   Does the client need an admin dashboard?
-   Should customers be able to make payments?
-   Is content writing required?
-   Is domain and hosting included?
-   Does the client need SEO setup?
-   Who will provide images and written content?
-   Does the client need maintenance after launch?
-   What is the target launch date?
-   Is there an existing website or platform to migrate?

### 5.4 Recommendation cards

For every proposed feature or service, the AI should show:

-   Feature or service name
-   What it does
-   Why it may be useful
-   The client problem it addresses
-   Whether it is essential, recommended or optional
-   Estimated cost, only where pricing data exists
-   Estimated timeline impact, where known
-   Include / exclude / ask client decision

The user must approve any addition that changes scope, price or delivery
time.

### 5.5 Proposal readiness check

Before generation, show:

-   Completed information
-   Missing information
-   Unconfirmed assumptions
-   Unpriced items
-   Scope conflicts
-   Suggested questions still unanswered
-   Readiness status

Allow the user to proceed with clearly marked assumptions, but warn them
where missing details may affect the proposal.

### 5.6 AI writing controls

-   Formal, persuasive, concise, friendly or technical tone
-   Audience-specific language
-   Rewrite selected section
-   Expand or shorten section
-   Improve clarity
-   Check consistency
-   Remove unsupported claims
-   Suggest stronger value explanation
-   Generate executive summary
-   Generate project objectives
-   Generate scope and deliverables
-   Generate implementation methodology
-   Generate risks and assumptions
-   Generate next steps

The user must be able to edit all generated content.

------------------------------------------------------------------------

## 6. Proposal builder

Proposals must be substantial, multi-page documents where appropriate,
not restricted to a single page.

### 6.1 Proposal document sections

The user can reorder, enable, disable and edit sections. Suggested
sections:

1.  Branded cover page
2.  Proposal reference and date
3.  Prepared for / prepared by
4.  Table of contents (for longer documents)
5.  Executive summary
6.  Understanding of the client's business
7.  Current challenges or opportunity
8.  Project objectives
9.  Proposed solution
10. Scope of work
11. Features and functionality
12. Deliverables
13. Why the service is needed
14. Expected benefits and outcomes
15. Implementation methodology
16. Project timeline and milestones
17. Package comparison table
18. Recommended package
19. Investment and pricing summary
20. Payment schedule
21. Why choose us?
22. Relevant portfolio and case studies
23. Team and qualifications, where relevant
24. Assumptions and dependencies
25. Exclusions
26. Risks and mitigation, where relevant
27. Terms and conditions
28. Proposal validity
29. Acceptance instructions
30. Contact information and next steps

The system should select appropriate sections based on project
complexity. It should not force every proposal to contain all sections.

### 6.2 Required persuasive sections

**Why this service is needed**

Explain the client's problem, the implications of leaving it unresolved
and how the proposed service addresses it. Avoid fearmongering and
unsupported claims.

**Why choose us / Why trust us**

Use actual user profile evidence: relevant portfolio, testimonials,
qualifications, experience and case studies. If evidence is missing,
prompt the user to add it or use a modest factual statement rather than
fabricate proof.

**Expected benefits**

Explain realistic business benefits and distinguish expected outcomes
from guaranteed outcomes.

### 6.3 Package comparison table

Every full proposal should include a package comparison table by
default. The user may configure the table or disable it for a proposal
where comparison is genuinely unsuitable, but the default should be on.

Example:

  Feature                        Basic   Professional   Enterprise
  --------------------- -------------- -------------- ------------
  Custom design               Included       Included     Included
  Responsive layout           Included       Included     Included
  Admin dashboard         Not included       Included     Included
  SEO setup                      Basic       Advanced     Advanced
  Payment integration         Optional       Included     Included
  Support                      14 days        30 days      90 days
  Price                        ₦70,000       ₦120,000     ₦200,000

Rules:

-   Values must come from the user's configured packages or approved
    proposal inputs.
-   Do not show a feature as included unless it is actually in that
    package.
-   Clearly label optional extras and exclusions.
-   Highlight a recommended package only with an explanation.
-   Support custom columns and rows.
-   Ensure tables remain readable in PDF and print output.

### 6.4 Proposal editing and versioning

-   Rich-text editing
-   Add, remove and reorder sections
-   Insert images, tables and page breaks
-   Edit headers and footers
-   Preview desktop and print layouts
-   Save drafts automatically
-   Duplicate proposals
-   Create revisions and versions
-   Compare versions
-   Restore an earlier version
-   Record who changed a proposal and when
-   Lock an accepted version against silent editing

### 6.5 Proposal statuses

Suggested statuses:

-   Draft
-   Discovery in progress
-   Ready for review
-   Sent
-   Viewed
-   Changes requested
-   Accepted
-   Declined
-   Expired
-   Withdrawn
-   Converted to project

------------------------------------------------------------------------

## 7. Proposal acceptance token and approval workflow

This is a core feature and must be implemented as a secure workflow, not
merely a public document URL.

### 7.1 Acceptance token creation

When a proposal is shared, the system can create a unique,
cryptographically secure acceptance token.

Token requirements:

-   High-entropy, unguessable random token
-   Store only a secure hash of the token where practical
-   Associate it with one proposal and one business account
-   Include an expiry date
-   Support revocation and regeneration
-   Allow configurable view-only or approval permissions
-   Never expose sequential database IDs as authorization tokens
-   Rate-limit token access and acceptance attempts
-   Avoid placing sensitive client details in the token itself

### 7.2 Shareable proposal link

The user can:

-   Copy the secure link
-   Send it by email or messaging app
-   Set an expiry date
-   Require client email verification, if enabled
-   Revoke a link
-   Generate a replacement link
-   See link status

### 7.3 Client proposal viewing

The client can:

-   View a responsive proposal
-   Download an allowed PDF
-   Review package comparisons
-   View pricing and payment terms
-   Ask a question or request a revision
-   Accept or decline
-   Select a package, if the proposal allows package selection

### 7.4 Acceptance steps

1.  Client opens the secure proposal link.
2.  System validates token, expiry and status.
3.  Client reviews the proposal.
4.  Client selects the package, if applicable.
5.  Client confirms their name and authorized email.
6.  Client checks an explicit acceptance statement.
7.  Client signs or confirms acceptance, depending on the configured
    legal workflow.
8.  System records the acceptance event and freezes the accepted
    proposal version.
9.  Business owner receives a notification.
10. User can convert the accepted proposal into a project and
    quotation/invoice workflow.

### 7.5 Acceptance audit record

Store:

-   Proposal ID and version
-   Token ID (not the raw token)
-   Client identity details supplied or verified
-   Selected package
-   Accepted amount and currency
-   Acceptance statement version
-   Timestamp
-   Relevant event history
-   Signature or confirmation evidence, if enabled
-   Document version/hash
-   IP and user-agent metadata only where lawful, disclosed and
    necessary

The platform should not claim that a click is a legally sufficient
electronic signature in every jurisdiction. Provide configurable
acceptance wording and advise businesses to obtain legal advice for
high-value or regulated contracts.

### 7.6 Change requests and rejection

Clients should be able to:

-   Request changes with comments
-   Explain why they declined
-   Ask for a different package
-   Submit questions

A change request should create a new proposal version or revision
request. It must not silently alter an already accepted version.

------------------------------------------------------------------------

## 8. Quotation generator

Quotation creation should work independently or from a proposal.

### 8.1 Quotation fields

-   Quotation number
-   Issue date
-   Expiry date
-   Business details and logo
-   Client details
-   Item or service description
-   Quantity
-   Unit
-   Unit price
-   Line discount
-   Tax
-   Delivery/setup fee
-   Subtotal
-   Overall discount
-   Total payable
-   Currency
-   Payment terms
-   Notes and exclusions
-   Authorized signature

### 8.2 Financial calculations

Example:

  Item                     Amount
  -------------------- ----------
  Website design         ₦100,000
  Domain and hosting      ₦20,000
  SEO setup               ₦30,000
  Subtotal               ₦150,000
  Discount (10%)         -₦15,000
  Total                  ₦135,000

Calculation rules:

-   Support fixed-amount and percentage discounts.
-   Support line-level and document-level discounts.
-   Define whether discounts apply before tax.
-   Configure tax rates and tax-inclusive/exclusive pricing.
-   Prevent negative quantities and invalid prices.
-   Recalculate totals on the server.
-   Store a snapshot of prices and terms at issue time.
-   Clearly show currency and rounding rules.

### 8.3 Quotation workflow

-   Draft
-   Issued
-   Sent
-   Viewed
-   Accepted
-   Rejected
-   Expired
-   Converted to project or invoice
-   Cancelled

### 8.4 Export and sharing

-   PDF download
-   PNG/JPG export
-   Print-friendly page
-   Secure share link
-   Email/share action where integrations are configured

------------------------------------------------------------------------

## 9. Receipt generator and payment records

Receipts should be created from recorded payments, not merely from an
unverified statement that money was received.

### 9.1 Receipt fields

-   Unique receipt number
-   Business details and logo
-   Client details
-   Payment date
-   Payment method
-   Transaction/reference number
-   Related project, quotation or invoice
-   Amount received
-   Currency
-   Payment description
-   Previous amount paid
-   Total project/quotation amount
-   Outstanding balance
-   Authorized signature or stamp
-   Receipt notes

### 9.2 Payment types

-   Deposit
-   Part payment
-   Instalment
-   Milestone payment
-   Final/balance payment
-   Full payment
-   Refund or reversal record

### 9.3 Example

For a quotation of ₦135,000:

-   Total amount: ₦135,000
-   First payment: ₦50,000
-   Outstanding balance: ₦85,000

The system should automatically update the payment ledger and
outstanding balance when a payment is recorded.

### 9.4 Receipt output

-   PDF
-   PNG/JPG image
-   Print
-   Secure share link
-   Re-download from client and project history

A receipt must clearly identify whether it records a manually confirmed
payment or a payment verified through an integrated payment provider.

------------------------------------------------------------------------

## 10. Client CRM

The CRM is a central record of every lead and client relationship.

### 10.1 Client records

Fields:

-   Client or company name
-   Client type: individual or organization
-   Industry
-   Contact person
-   Role/title
-   Email
-   Phone
-   Address/location
-   Website
-   Social links
-   Lead source
-   Assigned team member
-   Tags
-   Notes
-   Communication preferences
-   Relationship status
-   Created date
-   Last interaction date

### 10.2 CRM pipeline

Suggested stages:

1.  New lead
2.  Contacted
3.  Discovery scheduled
4.  Needs identified
5.  Proposal in preparation
6.  Proposal sent
7.  Negotiation / revision
8.  Won
9.  Lost
10. Existing client
11. Archived

Users can customize pipeline stages.

### 10.3 Client profile page

Each client profile should show:

-   Contact and company information
-   Notes and interaction history
-   All proposals and versions
-   Proposal status and value
-   Quotations
-   Receipts and payments
-   Active and completed projects
-   Outstanding balances
-   Uploaded files
-   Tasks and reminders
-   Assigned team members
-   Activity timeline

### 10.4 CRM actions

-   Add client manually
-   Import/export contacts with permission
-   Create a client from a proposal
-   Convert a lead to a client
-   Merge duplicate records with confirmation
-   Add notes and tags
-   Schedule follow-up reminders
-   Assign owners
-   Search and filter clients
-   Archive or restore clients
-   View client lifetime value based on recorded transactions

### 10.5 Follow-up management

-   Set a follow-up date
-   Record call, meeting, email or message
-   Add outcome and next action
-   Remind assigned team member
-   Show overdue follow-ups
-   Display last contact date

Do not send messages automatically without user authorization and an
enabled integration.

------------------------------------------------------------------------

## 11. Project and progress tracker

An accepted proposal can be converted into a project.

### 11.1 Project creation

Carry forward:

-   Client
-   Accepted proposal and version
-   Selected package
-   Agreed scope
-   Deliverables
-   Price and currency
-   Payment schedule
-   Timeline
-   Terms and assumptions

The user can adjust project-specific dates and assignments.

### 11.2 Project statuses

-   Not started
-   Planning
-   In progress
-   Waiting for client
-   On hold
-   Review
-   Completed
-   Cancelled

### 11.3 Tasks and milestones

-   Create tasks
-   Assign team members
-   Set start and due dates
-   Set priority
-   Add descriptions and attachments
-   Mark dependencies
-   Add comments
-   Record completion
-   Create milestone groups
-   Notify relevant people about changes

### 11.4 Progress calculation

Progress should be calculated from completed tasks and their weights,
not generated by AI.

Example:

-   Discovery: 10%
-   Design: 20%
-   Development: 40%
-   Testing: 20%
-   Delivery: 10%

Display:

-   Overall completion percentage
-   Completed tasks
-   Pending tasks
-   Overdue tasks
-   Upcoming milestones
-   Timeline status
-   Payment status

### 11.5 Client project portal

Where enabled, clients can view approved milestones, progress updates,
deliverables and shared files. Internal notes, private task discussions
and confidential business data must remain hidden.

------------------------------------------------------------------------

## 12. Financial dashboard

The financial dashboard gives the business owner a reliable view of
money recorded in the platform.

### 12.1 Main financial summary

Display configurable date ranges and currency filters for:

-   Total revenue received
-   Payments received this month
-   Outstanding client balances
-   Total value of accepted proposals
-   Issued quotation value
-   Overdue payments
-   Discounts granted
-   Refunds and reversals
-   Project expenses, if expense tracking is enabled
-   Net cash position from recorded income and expenses

Clearly distinguish cash received from proposal value, quotation value
and unpaid receivables. Do not label unpaid proposal value as revenue.

### 12.2 Income and payment ledger

Each transaction should include:

-   Transaction ID
-   Client
-   Project
-   Related quotation/invoice
-   Amount
-   Currency
-   Payment date
-   Method
-   Provider reference, if any
-   Status
-   Recorded by
-   Notes
-   Refund/reversal linkage

Statuses:

-   Pending
-   Confirmed
-   Failed
-   Reversed
-   Refunded
-   Manually recorded

### 12.3 Payment tracking

-   Full and partial payments
-   Deposits
-   Instalments
-   Milestone payments
-   Outstanding balance
-   Due dates
-   Overdue status
-   Payment reminders
-   Payment history
-   Downloadable receipts

### 12.4 Expenses (recommended)

Allow users to record:

-   Expense category
-   Description
-   Amount and currency
-   Date
-   Related project
-   Vendor/payee
-   Receipt attachment
-   Notes

Expense tracking should be optional. It should not imply formal
accounting or tax compliance unless the product is specifically built
and validated for that purpose.

### 12.5 Financial reports

-   Income by month
-   Income by client
-   Income by service
-   Payments by method
-   Outstanding balances by age
-   Discounts granted
-   Project profitability estimate, where cost data exists
-   Expenses by category
-   Cash flow summary based on recorded transactions

### 12.6 Financial safeguards

-   Server-side calculations
-   Immutable transaction audit trail
-   Role-based access
-   Currency-aware reporting
-   No silent edits to confirmed payments
-   Corrections through reversal/adjustment records
-   Exportable records
-   Clear manual versus provider-verified payment labels

------------------------------------------------------------------------

## 13. Proposal and business analytics

Analytics should help users understand sales performance, proposal
effectiveness and operational progress.

### 13.1 Proposal analytics

-   Total proposals created
-   Proposals sent
-   Proposals viewed
-   Proposals accepted
-   Proposals declined
-   Proposals expired
-   Acceptance rate
-   Average proposal value
-   Average time to acceptance
-   Proposal value by status
-   Conversion by service/category
-   Conversion by lead source
-   Proposal revision frequency

Define each metric clearly. For example, acceptance rate should state
whether its denominator is all sent proposals or only proposals with a
final decision.

### 13.2 Client and CRM analytics

-   New leads over time
-   Leads by source
-   Lead-to-client conversion
-   Pipeline value
-   Pipeline by stage
-   Follow-ups overdue
-   Average time from lead to proposal
-   Average time from proposal to acceptance
-   Repeat-client rate
-   Client lifetime revenue based on recorded payments

### 13.3 Financial analytics

-   Revenue received over time
-   Outstanding receivables
-   Average payment size
-   Revenue by service
-   Revenue by client
-   Discounts over time
-   Expense trends, if enabled
-   Estimated project margin where cost data exists

### 13.4 Project analytics

-   Active projects
-   Completed projects
-   Delayed projects
-   Tasks overdue
-   Average delivery time
-   Projects by status
-   Milestone completion
-   Projects by assigned team member

### 13.5 Filters and exports

-   Date range
-   Client
-   Service
-   Team member
-   Project
-   Currency
-   Proposal status
-   Lead source

Allow report export to PDF and CSV. Analytics must respect the user's
permissions and tenant boundaries.

### 13.6 Dashboard design

The home dashboard should prioritize:

-   Revenue received
-   Outstanding balances
-   Active projects
-   Proposals awaiting response
-   Proposal acceptance rate
-   New leads
-   Upcoming deadlines
-   Overdue follow-ups
-   Recent activity

Use clear charts and tables, but always provide the underlying figures
and date range.

------------------------------------------------------------------------

## 14. Client portal

An optional branded portal gives clients one place to interact with the
business.

### Client portal features

-   Secure sign-in or secure invitation link
-   View proposals
-   Accept, decline or request revisions
-   Select packages
-   View shared quotations
-   View payment instructions
-   View receipts
-   View approved project milestones
-   Submit feedback
-   Upload requested files
-   Download shared deliverables
-   View support/contact details

Business owners should be able to configure which portal features are
enabled for each client.

------------------------------------------------------------------------

## 15. Document templates, export and print

### 15.1 Document design system

Provide multiple professional templates:

-   Corporate
-   Minimal
-   Modern
-   Creative agency
-   Technical
-   Consulting
-   Elegant
-   Branded custom template

### 15.2 Export formats

  Document      PDF    PNG/JPG   Print   Secure link
  ----------- ----- ---------- ------- -------------
  Proposal      Yes   Optional     Yes           Yes
  Quotation     Yes        Yes     Yes           Yes
  Receipt       Yes        Yes     Yes           Yes
  Reports       Yes   Optional     Yes      Optional

### 15.3 Export requirements

-   Consistent page breaks
-   Correct fonts and symbols
-   Tables that do not overflow
-   Repeating headers for long tables
-   Page numbers where appropriate
-   Logo and brand colours
-   Currency formatting
-   Mobile-friendly preview
-   Print CSS
-   High-resolution image export
-   File naming using document number and client name

------------------------------------------------------------------------

## 16. Notifications and reminders

In-app notifications should cover:

-   Proposal viewed
-   Proposal accepted
-   Proposal declined
-   Revision requested
-   Proposal about to expire
-   Quotation accepted or expired
-   Payment recorded
-   Payment due or overdue
-   Project milestone approaching
-   Task assigned
-   Task overdue
-   Client feedback received
-   Follow-up reminder

Optional integrations:

-   Email
-   WhatsApp Business, subject to approved API access
-   Push notifications

Users must control notification preferences. Avoid unsolicited messaging
and respect consent and applicable messaging laws.

------------------------------------------------------------------------

## 17. Search, files and activity history

### Global search

Search across:

-   Clients
-   Proposals
-   Quotations
-   Receipts
-   Projects
-   Tasks
-   Transactions
-   Services

### File management

-   Upload business assets
-   Attach client files
-   Attach proposal references
-   Store project deliverables
-   Control visibility
-   Validate file types and sizes
-   Scan uploads where supported
-   Use private storage and expiring access links for sensitive files

### Activity timeline

Record important actions:

-   Client created or updated
-   Proposal generated, edited or sent
-   Proposal viewed or accepted
-   Quotation issued
-   Payment recorded or reversed
-   Receipt generated
-   Project created
-   Task completed
-   User invited or permission changed

Each event should include actor, timestamp, object and relevant change
details.

------------------------------------------------------------------------

## 18. Subscription and monetization

A possible subscription structure:

  -----------------------------------------------------------------------
  Plan                    Intended user           Possible limits
  ----------------------- ----------------------- -----------------------
  Free                    New users               Limited AI usage,
                                                  proposals and active
                                                  projects

  Starter                 Individual freelancers  Higher document and
                                                  client limits

  Professional            Growing businesses      CRM, analytics, client
                                                  portal and more AI
                                                  usage

  Agency                  Teams and agencies      Team seats, advanced
                                                  permissions and higher
                                                  limits
  -----------------------------------------------------------------------

Prices and limits should be validated through market research before
launch.

### Plan configuration

The platform administrator should be able to configure:

-   Monthly and annual prices
-   Trial periods
-   AI usage allowance
-   Document export limits
-   Number of clients
-   Active projects
-   Team seats
-   Storage allowance
-   Feature access
-   Grace period and renewal rules

The SaaS subscription payment is separate from payments that a business
records from its own clients.

------------------------------------------------------------------------

## 19. Security, privacy and reliability

This platform stores commercial and client information, so security must
be designed from the beginning.

### Required safeguards

-   Tenant isolation: every business can access only its own records.
-   Authentication and secure session management.
-   Role-based access control.
-   Secure password reset.
-   Optional multi-factor authentication.
-   Rate limiting on authentication and token endpoints.
-   CSRF protection where applicable.
-   Input validation and output encoding.
-   Secure file upload validation.
-   Private object storage.
-   Encryption in transit and appropriate encryption at rest.
-   Database backups and tested restoration.
-   Audit logs for sensitive actions.
-   Token expiry and revocation.
-   Secrets stored in environment variables or a secrets manager.
-   Data export and deletion workflows.
-   Privacy policy and terms of service.
-   Configurable retention rules.
-   Protection against IDOR and cross-tenant access.

### AI safety and quality

-   Do not invent facts, testimonials, credentials or portfolio results.
-   Do not invent prices or silently change configured prices.
-   Clearly label estimates and assumptions.
-   Require approval for scope and price changes.
-   Keep AI output editable.
-   Validate structured AI output before saving.
-   Avoid sending confidential client data to providers without
    appropriate disclosure and controls.
-   Provide a way to delete or exclude uploaded information from future
    AI context.

------------------------------------------------------------------------

## 20. Suggested technical architecture

A practical first implementation:

  -----------------------------------------------------------------------
  Layer                               Suggested technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js

  UI styling                          Tailwind CSS

  Backend/API                         Next.js server routes or dedicated
                                      API

  Database                            Neon PostgreSQL

  ORM                                 Drizzle ORM

  Authentication                      Better Auth or equivalent

  AI                                  Provider abstraction supporting
                                      Gemini, Groq and OpenRouter

  PDF generation                      HTML templates rendered with
                                      Playwright/Puppeteer

  Image export                        Browser rendering / Canvas-based
                                      export

  File storage                        Cloudinary or private S3-compatible
                                      object storage

  Payments                            Paystack for SaaS subscriptions;
                                      optional client-payment integration

  Hosting                             Vercel or suitable Node hosting

  Email                               Transactional email provider

  Background jobs                     Queue or scheduled job service for
                                      reminders and exports
  -----------------------------------------------------------------------

### Architecture principles

-   Multi-tenant SaaS from day one.
-   Business/workspace is the tenant boundary.
-   Keep AI provider integration behind a provider adapter.
-   Keep financial calculations in trusted server-side code.
-   Use reusable document templates.
-   Store document snapshots and versions.
-   Use background jobs for heavy PDF exports and scheduled reminders.
-   Keep audit records for approvals and financial changes.
-   Build APIs around clear business entities and permissions.

------------------------------------------------------------------------

## 21. Suggested database entities

A normalized relational model may include:

### Identity and tenancy

-   `users`
-   `businesses`
-   `business_members`
-   `roles`
-   `permissions`
-   `subscriptions`
-   `plans`
-   `usage_records`

### Business profile

-   `business_profiles`
-   `brand_settings`
-   `business_assets`
-   `portfolio_items`
-   `testimonials`
-   `certifications`

### Catalogue

-   `service_categories`
-   `services`
-   `service_features`
-   `packages`
-   `package_items`
-   `price_rules`
-   `tax_settings`

### CRM

-   `clients`
-   `client_contacts`
-   `client_tags`
-   `client_notes`
-   `client_interactions`
-   `leads`
-   `pipeline_stages`
-   `follow_up_tasks`

### AI and proposals

-   `opportunities`
-   `proposal_discovery_sessions`
-   `discovery_questions`
-   `discovery_answers`
-   `ai_recommendations`
-   `proposals`
-   `proposal_versions`
-   `proposal_sections`
-   `proposal_items`
-   `proposal_packages`
-   `proposal_comparisons`
-   `proposal_tokens`
-   `proposal_events`
-   `proposal_acceptances`
-   `proposal_change_requests`

### Quotations and receipts

-   `quotations`
-   `quotation_items`
-   `quotation_versions`
-   `receipts`
-   `receipt_items`
-   `document_sequences`

### Projects

-   `projects`
-   `project_members`
-   `project_tasks`
-   `project_milestones`
-   `project_updates`
-   `project_files`
-   `project_comments`

### Finance

-   `transactions`
-   `payments`
-   `payment_allocations`
-   `refunds`
-   `expenses`
-   `expense_categories`
-   `financial_adjustments`

### Platform-wide

-   `notifications`
-   `notification_preferences`
-   `files`
-   `activity_logs`
-   `audit_logs`
-   `document_templates`
-   `ai_usage_logs`
-   `support_tickets`

All tenant-owned records should include a `business_id` or have an
enforceable relationship to a business. Add appropriate indexes, foreign
keys, uniqueness constraints and row-level access controls where
supported.

------------------------------------------------------------------------

## 22. Key workflows

### Workflow A: First-time setup

1.  User registers.
2.  User creates a business workspace.
3.  User completes business profile.
4.  User uploads logo and configures branding.
5.  User adds services and prices.
6.  User adds portfolio and credibility evidence.
7.  User configures payment terms and document defaults.
8.  User reaches the dashboard.

### Workflow B: Create and send a proposal

1.  User selects New Proposal.
2.  User selects an existing client or creates a lead.
3.  User describes the opportunity.
4.  AI analyses the supplied information.
5.  AI asks adaptive discovery questions.
6.  User answers and reviews recommendations.
7.  User approves features, scope and package options.
8.  Application calculates pricing from approved data.
9.  AI generates proposal content.
10. User edits and previews the multi-page document.
11. User saves a version and sends a secure proposal link.
12. CRM and proposal analytics update.

### Workflow C: Client accepts a proposal

1.  Client opens the secure acceptance link.
2.  Server validates token and proposal state.
3.  Client reviews proposal and selects a package if applicable.
4.  Client accepts the explicit terms.
5.  System records the acceptance and freezes the accepted version.
6.  Business owner is notified.
7.  User converts the proposal into a project.
8.  User creates a quotation/payment schedule if needed.

### Workflow D: Record payment and issue receipt

1.  User opens the client or project record.
2.  User records a payment or receives a verified provider event.
3.  Server validates amount, currency and allocation.
4.  Ledger and outstanding balance update.
5.  User generates a receipt.
6.  Receipt is stored against the client and project.
7.  Client receives access if sharing is enabled.

### Workflow E: Manage project

1.  Accepted proposal becomes a project.
2.  Deliverables become tasks and milestones.
3.  User assigns team members and dates.
4.  Team updates task status.
5.  Progress is calculated from task weights.
6.  Approved updates appear in the client portal.
7.  Payments and project completion are tracked.

### Workflow F: Review business performance

1.  User opens Financial Dashboard or Analytics.
2.  Selects date range, currency and filters.
3.  System aggregates recorded business data.
4.  User reviews proposal conversion, revenue received, outstanding
    balances, client pipeline and project performance.
5.  User exports a report if required.

------------------------------------------------------------------------

## 23. Main application navigation

Suggested sidebar:

-   Dashboard
-   AI Proposal Studio
-   Proposals
-   Clients / CRM
-   Quotations
-   Receipts
-   Projects
-   Tasks
-   Payments
-   Financial Dashboard
-   Analytics
-   Services & Packages
-   Portfolio & Credentials
-   Document Templates
-   Notifications
-   Team
-   Business Settings
-   Subscription & Billing
-   Help & Support

The AI Proposal Studio should be prominent, but users must also be able
to create and manage documents manually.

------------------------------------------------------------------------

## 24. Development roadmap and priorities

### Phase 1 --- Foundation

-   Authentication
-   Multi-tenant business workspaces
-   Business profiling
-   Branding
-   Services and packages
-   Pricing configuration
-   File uploads and permissions

### Phase 2 --- AI proposal engine

-   Opportunity intake
-   Discovery questions
-   AI recommendations
-   Proposal readiness check
-   Proposal content generation
-   Multi-page editor
-   Comparison tables
-   Proposal PDF export
-   Proposal versioning

### Phase 3 --- Quotations and receipts

-   Quotation builder
-   Discount and tax calculations
-   PDF and image export
-   Payment recording
-   Receipt generation
-   Client payment history

### Phase 4 --- CRM and acceptance

-   Client database
-   Lead pipeline
-   Interaction timeline
-   Follow-up reminders
-   Secure acceptance tokens
-   Proposal viewing and acceptance
-   Change requests
-   Acceptance audit trail

### Phase 5 --- Projects and client portal

-   Convert accepted proposal to project
-   Tasks and milestones
-   Progress tracking
-   Client portal
-   Shared project updates
-   Client file exchange

### Phase 6 --- Financial dashboard and analytics

-   Payment ledger
-   Outstanding balance calculations
-   Revenue dashboard
-   Expense tracking (optional)
-   Proposal conversion analytics
-   CRM pipeline analytics
-   Project analytics
-   CSV/PDF reporting

### Phase 7 --- SaaS operations and growth

-   Subscription plans
-   Usage limits
-   Team permissions
-   Email and messaging integrations
-   Scheduled reminders
-   Admin dashboard
-   Monitoring, backups and support tools

------------------------------------------------------------------------

## 25. Minimum viable product (MVP)

Do not attempt to launch every advanced feature at once. The first
usable release should include:

1.  User registration and login
2.  Business profile and logo
3.  Services and price catalogue
4.  Client records
5.  AI discovery questions
6.  AI recommendations with user approval
7.  Multi-page proposal generation
8.  Mandatory-by-default package comparison table
9.  Why this service is needed section
10. Why choose us section based on real profile evidence
11. Proposal editor and PDF export
12. Secure proposal link and acceptance token
13. Quotation generator with discounts
14. Payment recording and receipt generator
15. Basic project tracker
16. Basic financial dashboard
17. Basic proposal and client analytics

Later releases can add advanced client portal features, team workflows,
expenses, detailed reports and more integrations.

------------------------------------------------------------------------

## 26. Acceptance criteria for the product

The product is ready for a public beta when:

-   A user can create a business profile and reuse it across documents.
-   A user can add services and prices without coding.
-   AI asks relevant, adaptive questions before generating a proposal.
-   AI recommendations can be accepted or rejected individually.
-   The system never changes prices without user approval.
-   A proposal can contain multiple pages and editable sections.
-   The proposal includes a package comparison table by default.
-   The proposal explains the client's need and the provider's
    credibility using supplied evidence.
-   The user can export a proposal to PDF.
-   A quotation correctly calculates items, discounts, taxes and totals.
-   A receipt can be generated from a recorded payment.
-   A client can be managed through the CRM.
-   A proposal can be shared with a secure, expiring and revocable
    acceptance token.
-   Acceptance is tied to a specific proposal version and recorded in an
    audit trail.
-   An accepted proposal can be converted into a project.
-   Project progress is calculated from tasks or milestone weights.
-   The financial dashboard distinguishes received money from unpaid
    proposal or quotation value.
-   Analytics use defined, traceable metrics.
-   Users cannot access another business's clients, documents, files or
    financial records.
-   All sensitive actions are permission-checked and audited.

------------------------------------------------------------------------

## 27. Product principles that must not be compromised

1.  **AI assists; the business owner decides.** The AI recommends, but
    users approve scope, prices, discounts, timelines and final wording.
2.  **No fabricated credibility.** Never invent testimonials, client
    names, awards, certifications or results.
3.  **Financial accuracy first.** All financial arithmetic is performed
    and validated by application code.
4.  **Secure acceptance.** Proposal approval links use unguessable,
    expiring and revocable tokens.
5.  **Version integrity.** An accepted proposal is tied to the exact
    version the client accepted.
6.  **Real progress.** Project percentages are derived from tasks or
    milestone weights.
7.  **Honest analytics.** Revenue means money received, not merely
    proposals sent or accepted.
8.  **Privacy by design.** Business and client records are isolated by
    tenant and role.
9.  **Editable documents.** Users can edit AI-generated content before
    sending.
10. **Professional output.** Proposals, quotations and receipts must
    look polished on screen, PDF and paper.

------------------------------------------------------------------------

## 28. Final product definition

Proposal AI is an AI-powered proposal and business operations platform
for service providers. It profiles a business, understands its services
and evidence of experience, analyses a prospective client's needs, asks
intelligent discovery questions, recommends relevant solutions and
generates a persuasive multi-page proposal with package comparisons.

It then supports the commercial workflow through quotations, discounts,
receipts, secure proposal acceptance tokens, client CRM, project
progress tracking, financial management and analytics.

**The goal is not simply to help users write proposals. The goal is to
help them win clients, manage delivery and understand their business
performance from one platform.**
