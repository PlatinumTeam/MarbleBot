module.exports = class DiscordUtil {
	/**
	 * Get a user's color, based on their highest colored role
	 * @param {Discord.Member} member
	 * @returns {string} Hex value of the user's color
	 */
	static getUserColor(member) {
		//Go down their roles until you find one that has a color
		let sortedRoles = DiscordUtil.getSortedRoles(member);
		for (const role of sortedRoles) {
			if (role.color !== 0) {
				let hex = role.color.toString(16);
				if (hex.length < 6) {
					hex = "0".repeat(6 - hex.length) + hex;
				}
				return hex;
			}
		}

		return "000000";
	}

	/**
	 * Get the highest priority hoisted role for this user. This is the role they'll appear under on Discord's user list.
	 * @param {Discord.Member} member
	 * @returns {string} Id of the highest hoisted role
	 */
	static getHoistedRoleId(member) {
		//Go down their roles until you find one that is hoisted
		let sortedRoles = DiscordUtil.getSortedRoles(member);
		for (const role of sortedRoles) {
			if (role.hoist) {
				return role.id;
			}
		}

		return "0";
	}

	/**
	 * Get a list of a member's roles, sorted from highest priority to lowest
	 * @param {Discord.Member} member
	 * @returns {Array <Discord.Role>} Sorted array of roles
	 */
	static getSortedRoles(member) {
		//Need to add these to a regular array so we don't get a Discord.js collection
		let roles = [];
		for (const [id, role] of member.roles) {
			roles.push(role);
		}
		//Sort them highest position -> lowest position
		roles.sort((a, b) => {
			return b.position - a.position;
		});
		return roles;
	}

	/**
	 * Format a role name to be presentable ingame. This includes breaking hyphens into words,
	 * uppercasing the first letter of every word, and uppercasing acronyms (words <= 2 chars)
	 * @param {string} role Role name
	 * @returns {string} Formatted name
	 */
	static formatRoleName(role) {
		role = role.replace(/-/g, ' ');
		//Capitalize the first letter of every word in the role name
		role = role.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
		//If any word is 2 or fewer characters then make it all caps.
		// Yes this is literally just because one of our roles is "PQ Developers" and looking at "Pq" bothers me.
		role = role.split(' ').map((word) => word.length < 3 ? word.toUpperCase() : word).join(' ');
		return role;
	}
};