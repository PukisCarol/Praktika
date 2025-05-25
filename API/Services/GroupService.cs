using Microsoft.EntityFrameworkCore;
using BandymasPraktikiai;
using BandymasPraktikiai.Data;
using Microsoft.Extensions.Logging;

namespace BandymasPraktikiai.Services
{
    public class GroupService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<GroupService> _logger;

        public GroupService(AppDbContext context, ILogger<GroupService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Group>> GetUserGroupsAsync(int userId)
        {
            var groups = await _context.GroupMembers
                .Where(gm => gm.UserId == userId)
                .Include(gm => gm.Group)
                .ThenInclude(g => g.Members)
                .ThenInclude(gm => gm.User)
                .Select(gm => gm.Group)
                .ToListAsync();
            return groups ?? new List<Group>();
        }

        public async Task<Group> CreateGroupAsync(string title, string username)
        {
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(username))
            {
                throw new ArgumentException("Title and username cannot be empty");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
            {
                user = new User { Username = username };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var group = new Group { Title = title };
            var groupMember = new GroupMember
            {
                UserId = user.Id,
                Username = username,
                User = user,
                Group = group,
            };
            group.Members.Add(groupMember);

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();
            return group;
        }

        public async Task<Group> GetGroupAsync(int id, int userId)
        {
            return await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .Include(g => g.Members)
                .ThenInclude(gm => gm.Debts)
                .Include(g => g.Transactions)
                .ThenInclude(t => t.Splits)
                .FirstOrDefaultAsync(g => g.Id == id && g.Members.Any(m => m.UserId == userId));
        }

        public async Task<bool> AddMemberAsync(int groupId, string newUsername, int userId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                throw new ArgumentException($"Group with ID {groupId} not found");
            }

            var newUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == newUsername);
            if (newUser == null)
            {
                newUser = new User { Username = newUsername };
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
            }

            if (group.Members.Any(m => m.UserId == newUser.Id))
            {
                throw new ArgumentException($"User {newUsername} is already a member of group {groupId}");
            }

            var groupMember = new GroupMember
            {
                UserId = newUser.Id,
                Username = newUsername,
                User = newUser,
                Group = group,
            };
            group.Members.Add(groupMember);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveMemberAsync(int groupId, int memberId, int userId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(gm => gm.Debts)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                throw new ArgumentException($"Group with ID {groupId} not found");
            }

            var groupMember = group.Members.FirstOrDefault(gm => gm.UserId == memberId);
            if (groupMember == null)
            {
                throw new ArgumentException($"Member with ID {memberId} not found in group {groupId}");
            }

            var firstMemberId = group.Members.OrderBy(m => m.Id).FirstOrDefault()?.Id;
            if (groupMember.Id == firstMemberId)
            {
                throw new ArgumentException("Cannot remove the first group member");
            }

            var debtsAsDebtor = groupMember.Debts.ToList();
            foreach (var debt in debtsAsDebtor)
            {
                var creditorMember = group.Members.FirstOrDefault(m => m.UserId == debt.CreditorId);
                if (creditorMember != null)
                {
                    creditorMember.Balance -= debt.Amount;
                    _context.MemberDebts.Remove(debt);
                }
            }

            var debtsAsCreditor = group.Members
                .SelectMany(m => m.Debts)
                .Where(d => d.CreditorId == memberId)
                .ToList();
            foreach (var debt in debtsAsCreditor)
            {
                var debtorMember = group.Members.FirstOrDefault(m => m.UserId == debt.DebtorId);
                if (debtorMember != null)
                {
                    debtorMember.Balance += debt.Amount;
                    _context.MemberDebts.Remove(debt);
                }
            }

            groupMember.Balance = 0;
            _context.GroupMembers.Remove(groupMember);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Transaction> CreateTransactionAsync(int groupId, int payerId, decimal amount, string splitType, Dictionary<int, decimal> splits, int userId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(gm => gm.Debts)
                .Include(g => g.Transactions)
                .ThenInclude(t => t.Splits)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                throw new ArgumentException($"Group with ID {groupId} not found");
            }

            if (!group.Members.Any(m => m.UserId == userId))
            {
                throw new ArgumentException($"User {userId} not authorized for group {groupId}");
            }

            var payer = group.Members.FirstOrDefault(m => m.UserId == payerId);
            if (payer == null)
            {
                throw new ArgumentException($"Payer with ID {payerId} not found in group {groupId}");
            }

            if (amount <= 0)
            {
                throw new ArgumentException("Transaction amount must be greater than 0");
            }

            var transaction = new Transaction
            {
                GroupId = groupId,
                PayerId = payerId,
                Amount = amount,
                SplitType = splitType,
                CreatedAt = DateTime.UtcNow,
                Splits = new List<TransactionSplit>(),
            };

            Dictionary<int, decimal> calculatedSplits = new Dictionary<int, decimal>();
            if (splitType == "Equal")
            {
                decimal equalAmount = amount / group.Members.Count;
                foreach (var member in group.Members)
                {
                    calculatedSplits[member.UserId] = equalAmount;
                    transaction.Splits.Add(new TransactionSplit
                    {
                        UserId = member.UserId,
                        Amount = equalAmount,
                    });
                }
            }
            else if (splitType == "Specific")
            {
                if (splits == null || splits.Count != 1 || splits.First().Value != amount)
                {
                    throw new ArgumentException("Specific split must assign the full amount to one member");
                }
                var targetUserId = splits.Keys.First();
                if (!group.Members.Any(m => m.UserId == targetUserId))
                {
                    throw new ArgumentException($"User {targetUserId} not in group {groupId}");
                }
                calculatedSplits[targetUserId] = amount;
                transaction.Splits.Add(new TransactionSplit
                {
                    UserId = targetUserId,
                    Amount = amount,
                });
            }
            else if (splitType == "Percentage")
            {
                if (splits == null || Math.Abs(splits.Values.Sum() - 100) > 0.01m)
                {
                    throw new ArgumentException("Percentage splits must sum to 100");
                }
                foreach (var split in splits)
                {
                    if (!group.Members.Any(m => m.UserId == split.Key))
                    {
                        throw new ArgumentException($"User {split.Key} not in group {groupId}");
                    }
                    decimal splitAmount = amount * (split.Value / 100);
                    calculatedSplits[split.Key] = splitAmount;
                    transaction.Splits.Add(new TransactionSplit
                    {
                        UserId = split.Key,
                        Amount = splitAmount,
                        Percentage = split.Value,
                    });
                }
            }
            else if (splitType == "Dynamically")
            {
                if (splits == null || Math.Abs(splits.Values.Sum() - amount) > 0.01m)
                {
                    throw new ArgumentException("Dynamic splits must sum to the transaction amount");
                }
                foreach (var split in splits)
                {
                    if (!group.Members.Any(m => m.UserId == split.Key))
                    {
                        throw new ArgumentException($"User {split.Key} not in group {groupId}");
                    }
                    calculatedSplits[split.Key] = split.Value;
                    transaction.Splits.Add(new TransactionSplit
                    {
                        UserId = split.Key,
                        Amount = split.Value,
                    });
                }
            }
            else
            {
                throw new ArgumentException("Invalid split type");
            }

            foreach (var split in calculatedSplits)
            {
                var member = group.Members.First(m => m.UserId == split.Key);
                decimal debtAmount = split.Value;

                if (member.UserId == payerId || debtAmount <= 0)
                {
                    continue;
                }

                var reverseDebt = group.Members
                    .SelectMany(m => m.Debts)
                    .FirstOrDefault(d => d.DebtorId == member.UserId && d.CreditorId == payerId && d.GroupMemId == member.Id);

                if (reverseDebt != null)
                {
                    if (reverseDebt.Amount == debtAmount)
                    {
                        _context.MemberDebts.Remove(reverseDebt);
                        member.Balance += debtAmount;
                        payer.Balance -= debtAmount;
                        debtAmount = 0;
                    }
                    else if (reverseDebt.Amount > debtAmount)
                    {
                        reverseDebt.Amount -= debtAmount;
                        member.Balance += debtAmount;
                        payer.Balance -= debtAmount;
                        debtAmount = 0;
                    }
                    else
                    {
                        debtAmount -= reverseDebt.Amount;
                        member.Balance += reverseDebt.Amount;
                        payer.Balance -= reverseDebt.Amount;
                        _context.MemberDebts.Remove(reverseDebt);
                    }
                }

                if (debtAmount > 0)
                {
                    var existingDebt = member.Debts.FirstOrDefault(d => d.DebtorId == member.UserId && d.CreditorId == payerId);
                    if (existingDebt != null)
                    {
                        existingDebt.Amount += debtAmount;
                    }
                    else
                    {
                        var newDebt = new MemberDebt
                        {
                            GroupMemId = member.Id,
                            GroupMember = member,
                            DebtorId = member.UserId,
                            CreditorId = payerId,
                            Amount = debtAmount,
                        };
                        member.Debts.Add(newDebt);
                    }
                    member.Balance -= debtAmount;
                    payer.Balance += debtAmount;
                }
            }

            group.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task<bool> SettleBalanceAsync(int groupId, int debtorId, int creditorId, decimal amount, int userId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(gm => gm.Debts)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                throw new ArgumentException($"Group with ID {groupId} not found");
            }

            var debtor = group.Members.FirstOrDefault(m => m.UserId == debtorId);
            var creditor = group.Members.FirstOrDefault(m => m.UserId == creditorId);
            if (debtor == null || creditor == null)
            {
                throw new ArgumentException($"Debtor or creditor not found in group {groupId}");
            }

            var debt = debtor.Debts.FirstOrDefault(d => d.CreditorId == creditorId && d.DebtorId == debtorId);
            if (debt == null || debt.Amount < amount)
            {
                throw new ArgumentException("Invalid debt or settlement amount");
            }

            debt.Amount -= amount;
            debtor.Balance += amount;
            creditor.Balance -= amount;

            if (debt.Amount == 0)
            {
                _context.MemberDebts.Remove(debt);
            }
            else if (debt.Amount < 0)
            {
                _context.MemberDebts.Remove(debt);
                var reverseDebt = new MemberDebt
                {
                    GroupMemId = creditor.Id,
                    GroupMember = creditor,
                    CreditorId = debtorId,
                    DebtorId = creditorId,
                    Amount = -debt.Amount,
                };
                creditor.Debts.Add(reverseDebt);
            }

            var remainingDebt = debtor.Debts.FirstOrDefault(d => d.DebtorId == debtorId && d.CreditorId == creditorId);
            var reverseDebtAfter = creditor.Debts.FirstOrDefault(d => d.DebtorId == creditorId && d.CreditorId == debtorId);
            if (remainingDebt != null && reverseDebtAfter != null && remainingDebt.Amount == reverseDebtAfter.Amount)
            {
                debtor.Balance += remainingDebt.Amount;
                creditor.Balance -= remainingDebt.Amount;
                _context.MemberDebts.Remove(remainingDebt);
                _context.MemberDebts.Remove(reverseDebtAfter);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}