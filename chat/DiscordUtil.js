module.exports = class DiscordUtil {
	static getRoleColor(member) {
		//Go down their roles until you find one that has a color
		let sortedRoles = DiscordUtil.getSortedRoles(member);
		for (const [roleId, role] of sortedRoles) {
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
	 * Get a list of a member's roles, sorted from highest priority to lowest
	 * @param member
	 * @returns Collection of [roleId, role]
	 */
	static getSortedRoles(member) {
		return member.roles.sort((a, b) => {
			return a.position < b.position;
		});
	}
};