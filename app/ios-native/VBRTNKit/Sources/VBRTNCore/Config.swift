import Foundation

/// Shared endpoints — identical to the web + Android clients.
public enum FRQNCYConfig {
    public static let apiBase = URL(string: "https://frqncy.network")!
    public static let supabaseURL = URL(string: "https://vyazlspbmwmlyncdlezh.supabase.co")!
    /// Publishable anon key — safe to ship; RLS is the guard.
    public static let supabaseAnonKey = "sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
}
