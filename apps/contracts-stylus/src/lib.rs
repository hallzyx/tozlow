// ============================================================
// Tozlow — TozlowSession Smart Contract (Arbitrum Stylus / Rust)
// stylus-sdk 0.10
// ============================================================

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use alloy_primitives::{Address, U256};
use alloy_sol_types::sol;
use stylus_sdk::prelude::*;
use stylus_sdk::storage::{StorageAddress, StorageBool, StorageMap, StorageU256};

// ── Errors & Events ──────────────────────────────────────
sol! {
    error AlreadyInitialized();
    error NotParticipant();
    error AlreadyDeposited();
    error DeadlineNotReached();
    error DeadlineReached();
    error AlreadyFinalized();
    error NotEnoughParticipants();
    error TooManyParticipants();
    error TransferFailed();
    error AlreadyVoted();
    error InvalidAbsent();
    error NotAllDeposited();
    error VotingNotOpen();
    error VotingClosed();
    error SessionNotActive();
    error CannotVoteSelf();

    event SessionCreated(
        uint256 indexed session_id,
        address indexed host,
        uint256 amount,
        uint256 deadline,
        uint256 voting_period,
        uint256 participant_count
    );
    event Deposited(uint256 indexed session_id, address indexed participant);
    event VoteCast(uint256 indexed session_id, address indexed voter, address indexed absent);
    event Finalized(uint256 indexed session_id, uint256 absentee_count, uint256 reward_per_attendee);
    event Refunded(uint256 indexed session_id);
}

#[derive(SolidityError)]
pub enum TozlowError {
    AlreadyInitialized(AlreadyInitialized),
    NotParticipant(NotParticipant),
    AlreadyDeposited(AlreadyDeposited),
    DeadlineNotReached(DeadlineNotReached),
    DeadlineReached(DeadlineReached),
    AlreadyFinalized(AlreadyFinalized),
    NotEnoughParticipants(NotEnoughParticipants),
    TooManyParticipants(TooManyParticipants),
    TransferFailed(TransferFailed),
    AlreadyVoted(AlreadyVoted),
    InvalidAbsent(InvalidAbsent),
    NotAllDeposited(NotAllDeposited),
    VotingNotOpen(VotingNotOpen),
    VotingClosed(VotingClosed),
    SessionNotActive(SessionNotActive),
    CannotVoteSelf(CannotVoteSelf),
}

// ── External ERC-20 interface ────────────────────────────
sol_interface! {
    interface IERC20 {
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function transfer(address to, uint256 amount) external returns (bool);
    }
}

// ── Storage ──────────────────────────────────────────────
//
// Session lifecycle:
//   1. create_session → active=false, finalized=false
//   2. All participants deposit → active=true
//   3. deadline arrives → voting window opens (voting_period seconds)
//   4. voting_period expires → finalize can be called
//   5. finalize:
//      a. If NOT all deposited → refund everyone who deposited
//      b. Mark non-voters as absent
//      c. Count majority votes → mark voted-absent
//      d. Pool absentee funds → split among attendees
//
#[storage]
#[entrypoint]
pub struct TozlowSession {
    initialized: StorageBool,
    usdc_token: StorageAddress,
    owner: StorageAddress,
    next_session_id: StorageU256,
    // Per-session scalars
    session_host: StorageMap<U256, StorageAddress>,
    session_amount: StorageMap<U256, StorageU256>,
    session_deadline: StorageMap<U256, StorageU256>,
    session_voting_period: StorageMap<U256, StorageU256>,
    session_finalized: StorageMap<U256, StorageBool>,
    session_active: StorageMap<U256, StorageBool>,
    session_participant_count: StorageMap<U256, StorageU256>,
    // Per-session-per-index → participant address
    participants: StorageMap<U256, StorageAddress>,
    // Per-session-per-address → deposited / voted / absence_votes
    deposited: StorageMap<U256, StorageBool>,
    voted: StorageMap<U256, StorageBool>,
    absence_votes: StorageMap<U256, StorageU256>,
}

// ── Helpers ──────────────────────────────────────────────
impl TozlowSession {
    fn participant_key(sid: U256, idx: U256) -> U256 {
        let mut buf = [0u8; 65];
        buf[0] = b'p';
        buf[1..33].copy_from_slice(&sid.to_be_bytes::<32>());
        buf[33..65].copy_from_slice(&idx.to_be_bytes::<32>());
        U256::from_be_bytes(alloy_primitives::keccak256(&buf).0)
    }

    fn addr_key(prefix: u8, sid: U256, addr: Address) -> U256 {
        let mut buf = [0u8; 53];
        buf[0] = prefix;
        buf[1..33].copy_from_slice(&sid.to_be_bytes::<32>());
        buf[33..53].copy_from_slice(addr.as_slice());
        U256::from_be_bytes(alloy_primitives::keccak256(&buf).0)
    }

    fn get_participant(&self, sid: U256, idx: U256) -> Address {
        self.participants.get(Self::participant_key(sid, idx))
    }

    fn is_participant(&self, sid: U256, addr: Address) -> bool {
        let count = self.session_participant_count.get(sid);
        let mut i = U256::ZERO;
        while i < count {
            if self.get_participant(sid, i) == addr { return true; }
            i += U256::from(1);
        }
        false
    }

    fn all_deposited(&self, sid: U256) -> bool {
        let count = self.session_participant_count.get(sid);
        let mut i = U256::ZERO;
        while i < count {
            let a = self.get_participant(sid, i);
            if !self.deposited.get(Self::addr_key(b'd', sid, a)) { return false; }
            i += U256::from(1);
        }
        true
    }

    fn collect_addrs(&self, sid: U256) -> Vec<Address> {
        let count = self.session_participant_count.get(sid);
        let mut out = Vec::new();
        let mut i = U256::ZERO;
        while i < count {
            out.push(self.get_participant(sid, i));
            i += U256::from(1);
        }
        out
    }

    fn voting_end(&self, sid: U256) -> U256 {
        self.session_deadline.get(sid) + self.session_voting_period.get(sid)
    }
}

// ── Public API ───────────────────────────────────────────
#[public]
impl TozlowSession {
    pub fn initialize(&mut self, usdc: Address) -> Result<(), TozlowError> {
        if self.initialized.get() {
            return Err(TozlowError::AlreadyInitialized(AlreadyInitialized {}));
        }
        let caller = self.vm().msg_sender();
        self.owner.set(caller);
        self.usdc_token.set(usdc);
        self.initialized.set(true);
        Ok(())
    }

    pub fn create_session(
        &mut self,
        amount: U256,
        deadline: U256,
        voting_period: U256,
        participants: Vec<Address>,
    ) -> Result<U256, TozlowError> {
        let n = participants.len();
        if n < 3 { return Err(TozlowError::NotEnoughParticipants(NotEnoughParticipants {})); }
        if n > 5 { return Err(TozlowError::TooManyParticipants(TooManyParticipants {})); }

        let sid = self.next_session_id.get();
        self.next_session_id.set(sid + U256::from(1));
        let caller = self.vm().msg_sender();

        self.session_host.setter(sid).set(caller);
        self.session_amount.setter(sid).set(amount);
        self.session_deadline.setter(sid).set(deadline);
        self.session_voting_period.setter(sid).set(voting_period);
        self.session_finalized.setter(sid).set(false);
        self.session_active.setter(sid).set(false);
        self.session_participant_count.setter(sid).set(U256::from(n));

        for (idx, addr) in participants.iter().enumerate() {
            self.participants.setter(Self::participant_key(sid, U256::from(idx))).set(*addr);
        }

        self.vm().log(SessionCreated {
            session_id: sid, host: caller, amount, deadline, voting_period,
            participant_count: U256::from(n),
        });
        Ok(sid)
    }

    pub fn deposit(&mut self, session_id: U256) -> Result<(), TozlowError> {
        let caller = self.vm().msg_sender();
        let now = U256::from(self.vm().block_timestamp());
        let deadline = self.session_deadline.get(session_id);

        if now >= deadline { return Err(TozlowError::DeadlineReached(DeadlineReached {})); }
        if self.session_finalized.get(session_id) { return Err(TozlowError::AlreadyFinalized(AlreadyFinalized {})); }
        if !self.is_participant(session_id, caller) { return Err(TozlowError::NotParticipant(NotParticipant {})); }
        let dk = Self::addr_key(b'd', session_id, caller);
        if self.deposited.get(dk) { return Err(TozlowError::AlreadyDeposited(AlreadyDeposited {})); }

        let amount = self.session_amount.get(session_id);
        let usdc_addr = self.usdc_token.get();
        let contract_addr = self.vm().contract_address();
        let token = IERC20::new(usdc_addr);

        let ctx = Call::new_mutating(self);
        let ok = token
            .transfer_from(self.vm(), ctx, caller, contract_addr, amount)
            .map_err(|_| TozlowError::TransferFailed(TransferFailed {}))?;
        if !ok { return Err(TozlowError::TransferFailed(TransferFailed {})); }

        self.deposited.setter(dk).set(true);
        if self.all_deposited(session_id) {
            self.session_active.setter(session_id).set(true);
        }
        self.vm().log(Deposited { session_id, participant: caller });
        Ok(())
    }

    /// Vote for who was absent. Only during voting window [deadline, deadline+voting_period).
    /// Cannot vote for yourself.
    pub fn cast_vote(&mut self, session_id: U256, absent: Address) -> Result<(), TozlowError> {
        let caller = self.vm().msg_sender();
        let now = U256::from(self.vm().block_timestamp());
        let deadline = self.session_deadline.get(session_id);
        let vote_end = self.voting_end(session_id);

        if now < deadline { return Err(TozlowError::VotingNotOpen(VotingNotOpen {})); }
        if now >= vote_end { return Err(TozlowError::VotingClosed(VotingClosed {})); }
        if self.session_finalized.get(session_id) { return Err(TozlowError::AlreadyFinalized(AlreadyFinalized {})); }
        if !self.session_active.get(session_id) { return Err(TozlowError::SessionNotActive(SessionNotActive {})); }
        if !self.is_participant(session_id, caller) { return Err(TozlowError::NotParticipant(NotParticipant {})); }
        if !self.is_participant(session_id, absent) { return Err(TozlowError::InvalidAbsent(InvalidAbsent {})); }
        if caller == absent { return Err(TozlowError::CannotVoteSelf(CannotVoteSelf {})); }
        let vk = Self::addr_key(b'v', session_id, caller);
        if self.voted.get(vk) { return Err(TozlowError::AlreadyVoted(AlreadyVoted {})); }

        self.voted.setter(vk).set(true);
        let ak = Self::addr_key(b'a', session_id, absent);
        let prev = self.absence_votes.get(ak);
        self.absence_votes.setter(ak).set(prev + U256::from(1));

        self.vm().log(VoteCast { session_id, voter: caller, absent });
        Ok(())
    }

    /// Finalize after voting period ends.
    ///
    /// 1. If NOT all deposited → refund depositors.
    /// 2. Non-voters → auto-absent.
    /// 3. Voters with majority votes against → absent.
    /// 4. Pool absentee funds → split among attendees.
    /// 5. No absentees or no attendees → refund all.
    pub fn finalize_session(&mut self, session_id: U256) -> Result<(), TozlowError> {
        let now = U256::from(self.vm().block_timestamp());
        let vote_end = self.voting_end(session_id);

        if now < vote_end { return Err(TozlowError::VotingNotOpen(VotingNotOpen {})); }
        if self.session_finalized.get(session_id) { return Err(TozlowError::AlreadyFinalized(AlreadyFinalized {})); }

        let all_addrs = self.collect_addrs(session_id);
        let count = all_addrs.len();
        let amount = self.session_amount.get(session_id);
        let usdc_addr = self.usdc_token.get();
        let token = IERC20::new(usdc_addr);

        // Case 1: Not all deposited → refund
        if !self.all_deposited(session_id) {
            for addr in &all_addrs {
                let dk = Self::addr_key(b'd', session_id, *addr);
                if self.deposited.get(dk) {
                    let ctx = Call::new_mutating(self);
                    token.transfer(self.vm(), ctx, *addr, amount)
                        .map_err(|_| TozlowError::TransferFailed(TransferFailed {}))?;
                }
            }
            self.session_finalized.setter(session_id).set(true);
            self.vm().log(Refunded { session_id });
            return Ok(());
        }

        // Case 2: All deposited → resolve
        let mut voter_count: usize = 0;
        for addr in &all_addrs {
            let vk = Self::addr_key(b'v', session_id, *addr);
            if self.voted.get(vk) { voter_count += 1; }
        }

        // Threshold = majority of voters (more than half)
        let threshold = if voter_count > 0 {
            U256::from(voter_count / 2 + 1)
        } else {
            U256::from(1)
        };

        let mut absentees: Vec<Address> = Vec::new();
        let mut attendees: Vec<Address> = Vec::new();

        for addr in &all_addrs {
            let vk = Self::addr_key(b'v', session_id, *addr);
            let did_vote = self.voted.get(vk);

            if !did_vote {
                // Auto-absent: didn't vote
                absentees.push(*addr);
            } else {
                let ak = Self::addr_key(b'a', session_id, *addr);
                let votes_against = self.absence_votes.get(ak);
                if votes_against >= threshold {
                    absentees.push(*addr);
                } else {
                    attendees.push(*addr);
                }
            }
        }

        let absentee_count = absentees.len();
        let reward_per_attendee: U256;

        if absentee_count == 0 || attendees.is_empty() {
            // No absentees or everyone absent → refund
            for addr in &all_addrs {
                let ctx = Call::new_mutating(self);
                token.transfer(self.vm(), ctx, *addr, amount)
                    .map_err(|_| TozlowError::TransferFailed(TransferFailed {}))?;
            }
            reward_per_attendee = U256::ZERO;
        } else {
            // Pool ALL funds, split among attendees only
            let total_pool = amount * U256::from(count);
            let per_attendee = total_pool / U256::from(attendees.len());
            reward_per_attendee = per_attendee;
            for addr in &attendees {
                let ctx = Call::new_mutating(self);
                token.transfer(self.vm(), ctx, *addr, per_attendee)
                    .map_err(|_| TozlowError::TransferFailed(TransferFailed {}))?;
            }
        }

        self.session_finalized.setter(session_id).set(true);
        self.vm().log(Finalized { session_id, absentee_count: U256::from(absentee_count), reward_per_attendee });
        Ok(())
    }

    // ── Views ────────────────────────────────────────────
    pub fn get_session(&self, session_id: U256) -> (Address, U256, U256, U256, bool, bool, U256) {
        (
            self.session_host.get(session_id),
            self.session_amount.get(session_id),
            self.session_deadline.get(session_id),
            self.session_voting_period.get(session_id),
            self.session_finalized.get(session_id),
            self.session_active.get(session_id),
            self.session_participant_count.get(session_id),
        )
    }

    pub fn get_participant_at(&self, session_id: U256, index: U256) -> Address {
        self.get_participant(session_id, index)
    }

    pub fn has_deposited(&self, session_id: U256, addr: Address) -> bool {
        self.deposited.get(Self::addr_key(b'd', session_id, addr))
    }

    pub fn has_voted(&self, session_id: U256, addr: Address) -> bool {
        self.voted.get(Self::addr_key(b'v', session_id, addr))
    }

    pub fn absence_vote_count(&self, session_id: U256, addr: Address) -> U256 {
        self.absence_votes.get(Self::addr_key(b'a', session_id, addr))
    }

    pub fn voting_deadline(&self, session_id: U256) -> U256 {
        self.voting_end(session_id)
    }

    pub fn usdc_address(&self) -> Address { self.usdc_token.get() }
    pub fn session_count(&self) -> U256 { self.next_session_id.get() }
}

// ── Tests ────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use stylus_sdk::testing::*;

    fn addr(n: u8) -> Address { Address::from([n; 20]) }
    fn three() -> Vec<Address> { vec![addr(1), addr(2), addr(3)] }

    #[test]
    fn create_session_ok() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        let r = c.create_session(U256::from(1_000_000u64), U256::from(9_999_999_999u64), U256::from(300u64), three());
        assert!(r.is_ok());
        assert_eq!(r.unwrap(), U256::ZERO);
    }

    #[test]
    fn too_few() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        let r = c.create_session(U256::from(1u64), U256::from(999u64), U256::from(300u64), vec![addr(1), addr(2)]);
        assert!(matches!(r, Err(TozlowError::NotEnoughParticipants(_))));
    }

    #[test]
    fn too_many() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        let r = c.create_session(U256::from(1u64), U256::from(999u64), U256::from(300u64),
            vec![addr(1),addr(2),addr(3),addr(4),addr(5),addr(6)]);
        assert!(matches!(r, Err(TozlowError::TooManyParticipants(_))));
    }

    #[test]
    fn counter_increments() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        let p = three();
        let s0 = c.create_session(U256::from(100u64), U256::from(999u64), U256::from(300u64), p.clone()).unwrap();
        let s1 = c.create_session(U256::from(200u64), U256::from(999u64), U256::from(300u64), p).unwrap();
        assert_eq!(s0, U256::ZERO);
        assert_eq!(s1, U256::from(1));
    }

    #[test]
    fn init_twice_fails() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        assert!(c.initialize(addr(0xAA)).is_ok());
        assert!(matches!(c.initialize(addr(0xAA)), Err(TozlowError::AlreadyInitialized(_))));
    }

    #[test]
    fn get_session_returns_voting_period() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        c.create_session(U256::from(500u64), U256::from(1000u64), U256::from(300u64), three()).unwrap();
        let (_, amount, deadline, vp, _, _, count) = c.get_session(U256::ZERO);
        assert_eq!(amount, U256::from(500u64));
        assert_eq!(deadline, U256::from(1000u64));
        assert_eq!(vp, U256::from(300u64));
        assert_eq!(count, U256::from(3u64));
    }

    #[test]
    fn voting_deadline_calculated() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        c.create_session(U256::from(500u64), U256::from(1000u64), U256::from(300u64), three()).unwrap();
        assert_eq!(c.voting_deadline(U256::ZERO), U256::from(1300u64));
    }

    #[test]
    fn participant_retrieval() {
        let vm = TestVM::default();
        let mut c = TozlowSession::from(&vm);
        let p = three();
        c.create_session(U256::from(1u64), U256::from(999u64), U256::from(300u64), p.clone()).unwrap();
        assert_eq!(c.get_participant_at(U256::ZERO, U256::ZERO), p[0]);
        assert_eq!(c.get_participant_at(U256::ZERO, U256::from(1)), p[1]);
        assert_eq!(c.get_participant_at(U256::ZERO, U256::from(2)), p[2]);
    }
}
