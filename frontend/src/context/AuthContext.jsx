// ✅ New code — demo mode, no backend call
const refreshUserData = async () => {
    try {
        // Demo mode — just load from localStorage
        const { user: savedUser } = loadSession();
        if (savedUser) {
            setUser(savedUser);
            setUserData(savedUser);
        }
    } catch (error) {
        console.log('Demo mode — skipping refresh');
    } finally {
        setLoading(false);
    }
};