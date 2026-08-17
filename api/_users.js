const { supabaseRequest } = require("./_supabase");

function publicNameForUser(user) {
  if (user?.profile?.rsiStatus === "verified" && user.profile.rsiHandle) {
    return user.profile.rsiHandle;
  }

  return user?.profile?.publicName || user?.displayName || user?.username || "Player";
}

function toClient(row) {
  return {
    id: row.id,
    name: row.public_profile_name || row.rsi_handle || row.display_name || "Player",
    displayName: row.display_name || "",
    avatarUrl: row.avatar_url || "",
    rsiHandle: row.rsi_handle || "",
    publicProfileName: row.public_profile_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(user) {
  const profile = user?.profile || {};
  return {
    id: user.id,
    display_name: user.displayName || user.username || publicNameForUser(user),
    avatar_url: user.avatarUrl || "",
    rsi_handle: profile.rsiStatus === "verified" ? profile.rsiHandle || "" : "",
    public_profile_name: publicNameForUser(user),
  };
}

async function listUsers() {
  const rows = await supabaseRequest("users?select=*&order=updated_at.desc", {
    method: "GET",
  });
  return rows.map(toClient);
}

async function upsertUser(user, options = {}) {
  if (!user?.id) {
    return null;
  }

  try {
    const rows = await supabaseRequest("users?on_conflict=id", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(toRow(user)),
      useServiceRole: true,
    });
    return rows[0] ? toClient(rows[0]) : null;
  } catch (error) {
    if (options.required) {
      throw error;
    }
    console.warn("FSX user sync failed:", error?.message || error);
    return null;
  }
}

module.exports = {
  listUsers,
  upsertUser,
};
