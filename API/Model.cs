using System;
using System.Collections.Generic;

namespace BandymasPraktikiai
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public List<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    }

    public class Group
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public List<GroupMember> Members { get; set; } = new List<GroupMember>();
        public List<Transaction> Transactions { get; set; } = new List<Transaction>();
    }

    public class GroupMember
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; }
        public User User { get; set; }
        public int GroupId { get; set; }
        public Group Group { get; set; }
        public decimal Balance { get; set; }
        public List<MemberDebt> Debts { get; set; } = new List<MemberDebt>();
    }

    public class MemberDebt
    {
        public int Id { get; set; }
        public int GroupMemId { get; set; }
        public GroupMember GroupMember { get; set; }
        public int CreditorId { get; set; }
        public int DebtorId { get; set; }
        public decimal Amount { get; set; }
    }

    public class Transaction
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public int PayerId { get; set; }
        public decimal Amount { get; set; }
        public string SplitType { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TransactionSplit> Splits { get; set; } = new List<TransactionSplit>();
    }

    public class TransactionSplit
    {
        public int Id { get; set; }
        public int TransactionId { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public decimal? Percentage { get; set; }
    }

    public class TransactionRequest
    {
        public int PayerId { get; set; }
        public decimal Amount { get; set; }
        public string SplitType { get; set; }
        public Dictionary<int, decimal> Splits { get; set; }
    }

    public class SettlementRequest
    {
        public int DebtorId { get; set; }
        public int CreditorId { get; set; }
        public decimal Amount { get; set; }
    }
}