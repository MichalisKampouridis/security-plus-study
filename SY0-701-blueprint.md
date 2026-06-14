# CompTIA Security+ SY0-701 Exam Blueprint
# Source of Truth for Study App Generation

---

## 1. DOMAIN WEIGHTS

| Domain | Title                                        | Exam Weight |
|--------|----------------------------------------------|-------------|
| 1      | General Security Concepts                    | 12%         |
| 2      | Threats, Vulnerabilities & Mitigations       | 22%         |
| 3      | Security Architecture                        | 18%         |
| 4      | Security Operations                          | 28%         |
| 5      | Security Program Management & Oversight      | 20%         |

---

## 2. FULL OBJECTIVE SCHEMA (1.1 – 5.6)

### DOMAIN 1 — General Security Concepts (12%)

**1.1** Compare and contrast various types of security controls.
- Categories: Technical, Managerial, Operational, Physical
- Control types: Preventive, Deterrent, Detective, Corrective, Compensating, Directive

**1.2** Summarize fundamental security concepts.
- CIA Triad: Confidentiality, Integrity, Availability
- Non-repudiation
- Authentication, Authorization, Accounting (AAA)
- Gap analysis
- Zero Trust: Control plane (adaptive identity, threat scope reduction, policy-driven access control, policy administrator, policy engine), Data plane (implicit trust zones, subject/system, policy enforcement point)
- Physical security: Bollards, Access control vestibule, Fencing, Video surveillance, Security guard, Access badge, Lighting, Sensors (infrared, pressure, microwave, ultrasonic)
- Deception and disruption: Honeypot, Honeynet, Honeyfile, Fake telemetry, DNS sinkhole

**1.3** Explain the importance of change management processes and the impact to security.
- Business processes impacting security operation: Approval process, Ownership, Stakeholders, Impact analysis, Test results, Backout plan, Maintenance window, Standard operating procedure
- Technical implications: Allow lists/deny lists, Restricted activities, Downtime, Service and application restarts, Legacy applications, Dependencies
- Documentation: Updating diagrams, Updating policies/procedures, Version control

**1.4** Explain the importance of using appropriate cryptographic solutions.
- Public Key Infrastructure (PKI): Public key, Private key, Key escrow
- Encryption: Level (full-disk, partition, file, volume, database, record), Transport/communication, Asymmetric, Symmetric, Key exchange, Algorithms, Key length
- Tools: TPM, HSM, Key management system, Secure enclave
- Obfuscation: Steganography, Tokenization, Data masking
- Hashing
- Salting
- Digital signatures
- Key stretching
- Blockchain
- Open public ledger
- Certificates: Certificate authorities, Certificate revocation lists (CRL), OCSP, Self-signed, Third-party, Root of trust, Certificate signing request (CSR), Wildcard

---

### DOMAIN 2 — Threats, Vulnerabilities & Mitigations (22%)

**2.1** Compare and contrast common threat actors and motivations.
- Threat actors: Nation-state, Unskilled attacker, Hacktivist, Insider threat, Organized crime, Shadow IT
- Attributes: Internal/external, Resources/funding, Level of sophistication/capability
- Motivations: Data exfiltration, Espionage, Service disruption, Blackmail, Financial gain, Philosophical/political beliefs, Ethical, Revenge, Disruption/chaos, War

**2.2** Explain common threat vectors and attack surfaces.
- Message-based: Email, SMS, Instant messaging
- Image-based
- File-based
- Voice call
- Removable device
- Vulnerable software: Client-based vs. agentless
- Unsupported systems and applications
- Unsecure networks: Wireless, Wired, Bluetooth
- Open service ports
- Default credentials
- Supply chain: Managed service providers, Vendors, Suppliers
- Human vectors/social engineering: Phishing, Vishing, Smishing, Misinformation/disinformation, Impersonation, Business email compromise, Pretexting, Watering hole, Brand impersonation, Typosquatting

**2.3** Explain various types of vulnerabilities.
- Application: Memory injection, Buffer overflow, Race conditions (TOC/TOU), Malicious update
- OS-based
- Web-based: SQL injection, XSS
- Hardware: Firmware, End-of-life, Legacy
- Virtualization: VM escape, Resource reuse
- Cloud-specific
- Supply chain
- Cryptographic
- Misconfiguration
- Mobile device: Side loading, Jailbreaking
- Zero-day

**2.4** Given a scenario, analyze indicators of malicious activity.
- Malware: Ransomware, Trojan, Worm, Spyware, Bloatware, Virus, Keylogger, Logic bomb, Rootkit
- Physical attacks: Brute force, RFID cloning, Environmental
- Network attacks: DDoS, DNS attacks, Wireless, On-path, Credential replay, Malicious code
- Application attacks: Injection, Buffer overflow, Replay, Privilege escalation, Forgery, Directory traversal
- Cryptographic attacks: Downgrade, Collision, Birthday
- Password attacks: Spraying, Brute force
- Indicators: Account lockout, Concurrent session usage, Blocked content, Impossible travel, Resource consumption, Resource inaccessibility, Out-of-cycle logging, Published/documented, Missing logs

**2.5** Explain the purpose of mitigation techniques used to secure the enterprise.
- Segmentation
- Access control: ACL, Permissions
- Application allow list
- Isolation
- Patching
- Encryption
- Monitoring
- Least privilege
- Configuration enforcement
- Decommissioning
- Hardening techniques: Encryption, Installation of endpoint protection, Host-based firewall, Host-based IPS, Disabling ports/protocols, Default password changes, Removal of unnecessary software

---

### DOMAIN 3 — Security Architecture (18%)

**3.1** Compare and contrast security implications of different architecture models.
- Architecture and infrastructure concepts: Cloud (Responsibility matrix, Hybrid considerations, Third-party vendors), Infrastructure as code, Serverless, Microservices, Network infrastructure (Physical isolation/air gap, Logical segmentation, SDN), On-premises, Centralized vs. decentralized, Containerization, Virtualization, IoT, Industrial Control Systems (ICS/SCADA), RTOS, Embedded systems, High availability
- Considerations: Availability, Resilience, Cost, Responsiveness, Scalability, Ease of deployment, Risk transference, Ease of recovery, Patch availability, Inability to patch, Power, Compute

**3.2** Given a scenario, apply security principles to secure enterprise infrastructure.
- Infrastructure considerations: Device placement, Security zones, Attack surface, Connectivity, Failure modes (fail-open, fail-closed), Device attribute (active vs. passive, inline vs. tap/monitor), Network appliances (Jump server, Proxy server, IPS/IDS, Load balancer, Sensors), Port security (802.1X, EAP), Firewall types (WAF, UTM, NGFW, Layer 4/7)
- Secure communication/access: VPN, Remote access, Tunneling (TLS, IPSec), SD-WAN, SASE

**3.3** Compare and contrast concepts and strategies to protect data.
- Data types: Regulated, Trade secret, Intellectual property, Legal information, Financial information, Human/non-human readable
- Data classifications: Sensitive, Confidential, Public, Restricted, Private, Critical
- General data considerations: Data states (in use, in transit, at rest), Data sovereignty, Geolocation
- Methods to secure data: Geographic restrictions, Encryption, Hashing, Masking, Tokenization, Obfuscation, Segmentation, Permission restrictions

**3.4** Explain the importance of resilience and recovery in security architecture.
- High availability: Load balancing vs. clustering
- Site considerations: Hot, Cold, Warm, Geographic dispersion
- Platform diversity
- Multi-cloud systems
- Continuity of operations
- Capacity planning: People, Technology, Infrastructure
- Testing: Tabletop exercises, Fail over, Simulation, Parallel processing
- Backups: Onsite/offsite, Frequency, Encryption, Snapshots, Recovery, Replication, Journaling
- Power: Generators, UPS

---

### DOMAIN 4 — Security Operations (28%)

**4.1** Given a scenario, apply common security techniques to computing resources.
- Secure baselines: Establish, Deploy, Maintain
- Hardening targets: Mobile devices, Workstations, Switches, Routers, Cloud infrastructure, Servers, ICS/SCADA, Embedded systems, RTOS, IoT devices
- Wireless devices: Installation considerations (Site surveys, Heat maps)
- Mobile solutions: MDM, Deployment models (BYOD, COPE, CYOD), Connection methods (Cellular, WiFi, Bluetooth, NFC, USB, GPS, IR)
- Wireless security: Protocols (WPA2, WPA3), Authentication protocols (EAP, PEAP, EAP-TLS), Methods (PSK, Enterprise, Open)
- Application security: Input validation, Secure cookies, Static code analysis, Code signing
- Sandboxing
- Monitoring

**4.2** Explain the security implications of proper hardware, software, and data asset management.
- Acquisition/procurement process
- Assignment/accounting: Ownership, Classification
- Monitoring/asset tracking: Inventory, Enumeration
- Disposal/decommissioning: Sanitization, Destruction, Certification, Data retention

**4.3** Explain various activities associated with vulnerability management.
- Identification methods: Vulnerability scan, Penetration testing, Responsible disclosure program, Bug bounty program, System/process audit
- Analysis: Confirmation, Prioritization, CVE/CVSS, Vulnerability classification, Exposure factor, Environmental variables, Industry/organizational impact, Risk tolerance
- Vulnerability response and remediation: Patching, Insurance, Segmentation, Compensating controls, Exceptions and exemptions
- Validation of remediation: Rescanning, Audit, Verification
- Reporting

**4.4** Explain security alerting and monitoring concepts and tools.
- Monitoring computing resources: Systems, Applications, Infrastructure
- Activities: Log aggregation, Alerting, Scanning, Reporting, Archiving, Alert response and remediation/validation
- Tools: SCAP, Benchmarks, Agents/agentless, SIEM, Antivirus, DLP, SNMP traps, NetFlow, Vulnerability scanners

**4.5** Given a scenario, modify enterprise capabilities to enhance security.
- Firewall: Rules, Access lists, Ports/protocols, Screened subnets
- IDS/IPS: Trends, Signatures
- Web filter: Agent-based, Centralized proxy, URL scanning, Content categorization, Block rules, Reputation
- Operating system security: Group Policy, SELinux
- Implementation of secure protocols: Protocol selection, Port selection, Transport method
- DNS filtering
- Email security: DKIM, DMARC, DMARC, SPF, Gateway
- File integrity monitoring
- DLP
- NAC
- Endpoint detection and response (EDR)
- User behavior analytics

**4.6** Given a scenario, implement and maintain identity and access management.
- Provisioning/de-provisioning user accounts
- Permission assignments and implications
- Identity proofing
- Federation
- Single sign-on (SSO): LDAP, OAuth, SAML
- Interoperability
- Attestation
- Access controls: Mandatory, Discretionary, Role-based, Rule-based, Attribute-based, Time-of-day restrictions, Least privilege
- Multifactor authentication: Implementations (Biometrics, Hard/soft tokens, Security keys), Factors (Something you know/have/are, Somewhere you are)
- Password concepts: Password managers, Passwordless, Length, Complexity, Reuse, Expiration, Age, Pwnage check
- Privileged access management tools: Just-in-time permissions, Password vaulting, Ephemeral credentials

**4.7** Explain the importance of automation and orchestration related to secure operations.
- Use cases: User provisioning, Resource provisioning, Guard rails, Security groups, Ticket creation, Escalation, Enabling/disabling services, Continuous integration and testing, Integrations and APIs
- Benefits: Efficiency/time saving, Enforcing baselines, Standard infrastructure configurations, Scaling in a secure manner, Employee retention, Reaction time, Workforce multiplier
- Other considerations: Complexity, Cost, Single point of failure, Technical debt, Ongoing supportability

**4.8** Explain appropriate incident response activities.
- Process: Preparation, Detection, Analysis, Containment, Eradication, Recovery, Lessons learned
- Training
- Testing: Tabletop exercise, Simulation
- Root cause analysis
- Threat hunting
- Digital forensics: Legal hold, Chain of custody, Acquisition, Reporting, Preservation, E-discovery

**4.9** Given a scenario, use data sources to support an investigation.
- Log data: Firewall logs, Application logs, Endpoint logs, OS-specific security logs, IPS/IDS logs, Network logs, Metadata
- Data sources: Vulnerability scans, Automated reports, Dashboards, Packet captures

---

### DOMAIN 5 — Security Program Management & Oversight (20%)

**5.1** Summarize elements of effective security governance.
- Guidelines
- Policies: Acceptable use policy, Information security policies, Business continuity, Disaster recovery, Incident response, Software development lifecycle, Change management
- Standards: Password, Access control, Physical security, Encryption
- Procedures: Change management, Onboarding/offboarding, Playbooks
- External considerations: Regulatory, Legal, Industry, Local/regional/national/global
- Monitoring and revision
- Types of governance structures: Boards, Committees, Government entities, Centralized/decentralized
- Roles and responsibilities: Owners, Controllers, Processors, Custodians/stewards

**5.2** Explain elements of the risk management process.
- Risk identification
- Risk assessment: Ad hoc, Recurring, One-time, Continuous
- Risk analysis: Qualitative, Quantitative, Single loss expectancy (SLE), Annualized loss expectancy (ALE), Annualized rate of occurrence (ARO), Probability, Likelihood, Exposure factor, Impact
- Risk register: Key risk indicators, Risk owners, Risk threshold
- Risk tolerance
- Risk appetite: Expansive, Conservative, Neutral
- Risk management strategies: Transfer, Accept, Avoid, Mitigate
- Risk reporting
- Business impact analysis: RTO, RPO, MTTR, MTBF

**5.3** Explain the processes associated with third-party risk assessment and management.
- Vendor assessment: Penetration testing, Right to audit clause, Evidence of internal audits, Independent assessments, Supply chain analysis
- Vendor selection: Due diligence, Conflict of interest
- Agreement types: SLA, MOA, MOU, MSA, Work order/SOW, NDA, BPA
- Vendor monitoring
- Questionnaires
- Rules of engagement

**5.4** Summarize elements of effective security compliance.
- Compliance reporting: Internal, External
- Consequences of non-compliance: Fines, Sanctions, Reputational damage, Loss of license, Contractual impacts
- Compliance monitoring: Due diligence, Due care, Attestation, Acknowledgement, Internal/external audits, Automation
- Privacy: Legal implications, Local/regional/national/global, Data subject, Controller, Processor, Ownership, Data inventory and retention, Right to be forgotten

**5.5** Explain types and purposes of audits and assessments.
- Attestation
- Internal: Compliance, Audit committee, Self-assessments
- External: Regulatory, Examinations, Assessment, Independent third-party audit
- Penetration testing: Physical, Offensive, Defensive, Integrated, Known environment, Partially known environment, Unknown environment, Reconnaissance (passive, active)

**5.6** Given a scenario, implement security awareness practices.
- Phishing: Campaigns, Recognizing, Reporting
- Anomalous behavior recognition: Risky, Unexpected, Unintentional
- User guidance and training: Policy/handbooks, Situational awareness, Insider threat, Password management, Removable media and cables, Social engineering, Operational security, Hybrid/remote work environments
- Reporting and monitoring: Initial, Recurring
- Development
- Execution

---

## 3. JSON QUESTION SCHEMA

Every question file (questions-1.json through questions-5.json) must be a JSON array of objects. Each object must conform to this schema:

```json
{
  "id": "D1-001",
  "domain": 1,
  "objective": "1.2",
  "topic": "CIA Triad",
  "format": "multiple_choice",
  "difficulty": "medium",
  "stem": "Question text goes here.",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  "answer": "B",
  "explanation": "B is correct because... A is wrong because... C is wrong because... D is wrong because...",
  "comptia_logic_note": null
}
```

### Format Variants

**multiple_choice** — 4 options (A–D), single answer string  
**multi_select** — 4–5 options, answer is array e.g. `["A","C"]`, stem must say "choose TWO" or "choose THREE"  
**true_false** — options are only `{"A": "True", "B": "False"}`, answer is "A" or "B"  
**fill_blank** — no options field; use `"blank_answer"` and `"acceptable_answers"` array instead  
**matching** — no options field; use `"pairs"` array of `{"term": "...", "definition": "..."}` objects  
**pbq_scenario** — add a `"scenario"` field (string) before the stem; otherwise same as multiple_choice or multi_select  

---

## 4. ACRONYM LIST (Exam-Tested)

| Acronym | Full Term |
|---------|-----------|
| AAA | Authentication, Authorization, and Accounting |
| ACL | Access Control List |
| AES | Advanced Encryption Standard |
| ALE | Annualized Loss Expectancy |
| ARO | Annualized Rate of Occurrence |
| AUP | Acceptable Use Policy |
| BCP | Business Continuity Plan |
| BGP | Border Gateway Protocol |
| BPA | Business Partnership Agreement |
| BYOD | Bring Your Own Device |
| CA | Certificate Authority |
| CASB | Cloud Access Security Broker |
| CHAP | Challenge Handshake Authentication Protocol |
| CIA | Confidentiality, Integrity, Availability |
| COPE | Corporate Owned, Personally Enabled |
| CSR | Certificate Signing Request |
| CVE | Common Vulnerabilities and Exposures |
| CVSS | Common Vulnerability Scoring System |
| CYOD | Choose Your Own Device |
| DAC | Discretionary Access Control |
| DDoS | Distributed Denial of Service |
| DLP | Data Loss Prevention |
| DKIM | DomainKeys Identified Mail |
| DMARC | Domain-based Message Authentication, Reporting & Conformance |
| DNS | Domain Name System |
| DRP | Disaster Recovery Plan |
| EAP | Extensible Authentication Protocol |
| EDR | Endpoint Detection and Response |
| FDE | Full Disk Encryption |
| FIM | File Integrity Monitoring |
| GDPR | General Data Protection Regulation |
| GPO | Group Policy Object |
| HSM | Hardware Security Module |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | Hypertext Transfer Protocol Secure |
| ICS | Industrial Control System |
| IDS | Intrusion Detection System |
| IoT | Internet of Things |
| IPS | Intrusion Prevention System |
| IPSec | Internet Protocol Security |
| IR | Incident Response |
| LDAP | Lightweight Directory Access Protocol |
| MAC | Mandatory Access Control |
| MFA | Multifactor Authentication |
| MOA | Memorandum of Agreement |
| MOU | Memorandum of Understanding |
| MSA | Master Service Agreement |
| MTBF | Mean Time Between Failures |
| MTTR | Mean Time to Repair |
| NAC | Network Access Control |
| NDA | Non-Disclosure Agreement |
| NGFW | Next-Generation Firewall |
| NIST | National Institute of Standards and Technology |
| OCSP | Online Certificate Status Protocol |
| PAM | Privileged Access Management |
| PII | Personally Identifiable Information |
| PKI | Public Key Infrastructure |
| PTZ | Pan-Tilt-Zoom |
| RADIUS | Remote Authentication Dial-In User Service |
| RBAC | Role-Based Access Control |
| RPO | Recovery Point Objective |
| RTOS | Real-Time Operating System |
| RTO | Recovery Time Objective |
| SAML | Security Assertion Markup Language |
| SASE | Secure Access Service Edge |
| SCADA | Supervisory Control and Data Acquisition |
| SCAP | Security Content Automation Protocol |
| SD-WAN | Software-Defined Wide Area Network |
| SDN | Software-Defined Networking |
| SIEM | Security Information and Event Management |
| SLA | Service Level Agreement |
| SLE | Single Loss Expectancy |
| SOAR | Security Orchestration, Automation and Response |
| SOC | Security Operations Center |
| SOW | Statement of Work |
| SPF | Sender Policy Framework |
| SQL | Structured Query Language |
| SSH | Secure Shell |
| SSL | Secure Sockets Layer |
| SSO | Single Sign-On |
| TACACS+ | Terminal Access Controller Access Control System Plus |
| TLS | Transport Layer Security |
| TOC/TOU | Time-of-Check/Time-of-Use |
| TPM | Trusted Platform Module |
| UAT | User Acceptance Testing |
| UEBA | User and Entity Behavior Analytics |
| UTM | Unified Threat Management |
| VPN | Virtual Private Network |
| WAF | Web Application Firewall |
| WPA2 | Wi-Fi Protected Access 2 |
| WPA3 | Wi-Fi Protected Access 3 |
| XDR | Extended Detection and Response |
| XML | Extensible Markup Language |
| XSS | Cross-Site Scripting |

---

## 5. KEY PORT NUMBERS (Exam-Tested)

| Port | Protocol |
|------|----------|
| 20/21 | FTP (data/control) |
| 22 | SSH |
| 23 | Telnet |
| 25 | SMTP |
| 53 | DNS |
| 67/68 | DHCP |
| 80 | HTTP |
| 110 | POP3 |
| 119 | NNTP |
| 135 | RPC |
| 137–139 | NetBIOS |
| 143 | IMAP |
| 161/162 | SNMP |
| 389 | LDAP |
| 443 | HTTPS |
| 445 | SMB |
| 465 | SMTPS |
| 500 | IKE / IPSec |
| 514 | Syslog |
| 587 | SMTP (submission) |
| 636 | LDAPS |
| 993 | IMAPS |
| 995 | POP3S |
| 1433 | Microsoft SQL Server |
| 1521 | Oracle DB |
| 3306 | MySQL |
| 3389 | RDP |
| 5060/5061 | SIP |
| 8080 | HTTP alternate |
| 8443 | HTTPS alternate |

---

## 6. FREE STUDY RESOURCES DIRECTORY

The following are legitimate, freely available resources. The app may link to these but must never scrape or embed their content.

- **CompTIA Official Exam Objectives (SY0-701):** https://www.comptia.org/training/resources/exam-objectives
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework
- **NIST SP 800-53:** https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **CVE Database:** https://cve.mitre.org/
- **CVSS Calculator:** https://www.first.org/cvss/calculator/3.1
- **Professor Messer SY0-701 (free):** https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/
- **Cybrary (free tier):** https://www.cybrary.it/
- **SANS Reading Room:** https://www.sans.org/reading-room/

---

*End of SY0-701-blueprint.md — This file is the single source of truth for all question generation, schema validation, and app logic.*
