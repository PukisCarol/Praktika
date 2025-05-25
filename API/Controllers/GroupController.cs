using Microsoft.AspNetCore.Mvc;
using BandymasPraktikiai.Services;
using BandymasPraktikiai;

namespace BandymasPraktikiai.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupController : ControllerBase
    {
        private readonly GroupService _groupService;
        private readonly ILogger<GroupController> _logger;

        public GroupController(GroupService groupService, ILogger<GroupController> logger)
        {
            _groupService = groupService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetGroups()
        {
            try
            {
                int userId = GetUserId();
                var groups = await _groupService.GetUserGroupsAsync(userId);
                return Ok(groups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching groups");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] string title)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(title))
                {
                    _logger.LogWarning("CreateGroup called with empty title");
                    return BadRequest("Group title cannot be empty");
                }
                var username = User.Identity?.Name ?? "user1";
                _logger.LogInformation("Creating group with title: {Title} for user: {Username}", title, username);
                var group = await _groupService.CreateGroupAsync(title, username);
                return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group with title: {Title}", title);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGroup(int id)
        {
            try
            {
                int userId = GetUserId();
                var group = await _groupService.GetGroupAsync(id, userId);
                if (group == null) return NotFound();
                return Ok(group);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching group with id: {Id}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(int id, [FromBody] string newUsername)
        {
            try
            {
                int userId = GetUserId();
                var success = await _groupService.AddMemberAsync(id, newUsername, userId);
                return success ? Ok() : BadRequest("Failed to add member.");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to add member {Username} to group {Id}", newUsername, id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding member {Username} to group {Id}", newUsername, id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}/members/{memberId}")]
        public async Task<IActionResult> RemoveMember(int id, int memberId)
        {
            try
            {
                int userId = GetUserId();
                var success = await _groupService.RemoveMemberAsync(id, memberId, userId);
                return success ? Ok() : BadRequest("Failed to remove member.");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to remove member {MemberId} from group {Id}", memberId, id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing member {MemberId} from group {Id}", memberId, id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("{id}/transactions")]
        public async Task<IActionResult> CreateTransaction(int id, [FromBody] TransactionRequest request)
        {
            try
            {
                int userId = GetUserId();
                var transaction = await _groupService.CreateTransactionAsync(
                    id, request.PayerId, request.Amount, request.SplitType, request.Splits, userId);
                if (transaction == null) return BadRequest("Failed to create transaction.");
                return CreatedAtAction(nameof(GetGroup), new { id }, transaction);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to create transaction for group {Id}", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating transaction for group {Id}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("{id}/settle")]
        public async Task<IActionResult> SettleBalance(int id, [FromBody] SettlementRequest request)
        {
            try
            {
                int userId = GetUserId();
                var success = await _groupService.SettleBalanceAsync(id, request.DebtorId, request.CreditorId, request.Amount, userId);
                return success ? Ok() : BadRequest("Failed to settle balance.");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to settle balance for group {Id}", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error settling balance for group {Id}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private int GetUserId()
        {
            string name = User.Identity?.Name ?? "1";
            if (int.TryParse(name, out int userId))
            {
                return userId;
            }
            _logger.LogWarning("Invalid User.Identity.Name: {Name}, defaulting to userId 1", name);
            return 1;
        }
    }
}