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
    region: row.region || "",
    timeZone: row.time_zone || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(user) {
  // Preferences are updated only by saveUserPreferences. Session cookies and
  // fresh Discord logins must never overwrite newer values in the database.
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

function applyUserPreferences(user, savedUser) {
  if (!savedUser) return;
  user.profile = { ...(user.profile || {}), region: savedUser.region || "", timeZone: savedUser.timeZone || "" };
}

async function saveUserPreferences(user, preferences) {
  await upsertUser(user, { required: true });
  const rows = await supabaseRequest(`users?id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ region: preferences.region || null, time_zone: preferences.timeZone || null }),
    useServiceRole: true,
  });
  if (!rows[0]) throw new Error("Account preferences could not be saved.");
  return toClient(rows[0]);
}

module.exports = {
  listUsers,
  upsertUser,
  saveUserPreferences,
  applyUserPreferences,
};
