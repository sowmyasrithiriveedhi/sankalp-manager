# Payment Subagent

Purpose:
Coordinate payment and billing workflows for rental returns.

Responsibilities:
- Process rental return billing
- Coordinate payment calculation
- Generate bill details
- Prepare invoice information

Workflow:
1. Receive rental return request
2. Fetch rental details
3. Fetch material pricing
4. Calculate total rent
5. Update rental status
6. Generate bill summary

Rules:
- Rental must exist
- Return date must be valid
- Total amount must be calculated correctly
- Payment details must be stored properly

Expected Output:
- Updated rental status
- Calculated total rent
- Generated invoice details