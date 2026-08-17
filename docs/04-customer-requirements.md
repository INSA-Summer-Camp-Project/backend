# 04. Customer Requirements

The Customer represents the demand-side of the marketplace. They create jobs, hire workers, and pay for services.

## 1. What the Customer Sees (Pages)

- **Customer Dashboard:** A hub showing Active Jobs (In Progress), Posted Jobs waiting for applicants, and Completed Jobs.
- **Search & Discovery:** A directory of categories and individual worker profiles.
- **Post Job Page:** A form to detail their requirements.
- **Job Management Page:** A view of a specific job they posted, listing all received Applications (bids) from workers.
- **Payment Checkout:** A UI integrating Chapa to pay for a completed service.

## 2. Customer Capabilities

- **Create Service Request (Job Post):** They must provide Title, Description, Required Service Category, Budget, and Deadline (FR-027).
- **Direct Hire:** They can visit a Worker's profile and click "Hire Me" to bypass the public job board. _Technical Note:_ This still creates a `Job` entity in the database, but pre-assigns the `workerId` and skips the `Application` phase.
- **Application Management:** They compare incoming bids based on price, completion time, and worker rating (FR-033). They select _one_ applicant.
- **Payment & Review:** Once the service is marked complete, they initiate payment. Afterward, they submit a 1-5 star rating and optional text review (FR-042, FR-043).

## 3. What the Customer Cannot Do

- They cannot review or rate other customers.
- They cannot see jobs posted by other customers.
- They cannot apply to jobs.
- They should not be able to edit a Job's budget or scope _after_ a worker has been accepted (Architectural constraint to prevent disputes).
