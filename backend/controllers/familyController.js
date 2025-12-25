import User from "../models/User.js";

// Add family member
export const addFamilyMember = async (req, res) => {
  const { memberEmail, memberPhone, relation } = req.body;
  const userId = req.user?._id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if ((!memberEmail && !memberPhone) || !relation) return res.status(400).json({ message: "All fields are required" });
  if (!["father", "mother", "child", "sibling"].includes(relation)) return res.status(400).json({ message: "Invalid relation type" });

  try {
    const user = await User.findById(userId);
    let member = null;
    if (memberEmail) {
      member = await User.findOne({ email: memberEmail });
    } else if (memberPhone) {
      member = await User.findOne({ phone: memberPhone });
    }

    if (!user) return res.status(404).json({ message: "Current user not found" });
    if (!member) return res.status(404).json({ message: "Member user not found" });

    // Initialize arrays if undefined
    user.family.children ||= [];
    user.family.siblings ||= [];
    member.family.children ||= [];
    member.family.siblings ||= [];

    // Add relation
    switch (relation) {
      case "father":
        user.family.father = member._id;
        if (!member.family.children.includes(user._id)) member.family.children.push(user._id);
        break;
      case "mother":
        user.family.mother = member._id;
        if (!member.family.children.includes(user._id)) member.family.children.push(user._id);
        break;
      case "child":
        if (!user.family.children.includes(member._id)) user.family.children.push(member._id);
        if (user.gender === "male") member.family.father = user._id;
        else if (user.gender === "female") member.family.mother = user._id;
        break;
      case "sibling":
        if (!user.family.siblings.includes(member._id)) user.family.siblings.push(member._id);
        if (!member.family.siblings.includes(user._id)) member.family.siblings.push(user._id);
        break;
    }

    await Promise.all([user.save(), member.save()]);

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.mother family.siblings family.children");

    res.status(200).json({ message: "Family updated successfully", user: populatedUser });
  } catch (err) {
    console.error("Add family member error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Remove family member
export const removeFamilyMember = async (req, res) => {
  const { memberId, relation } = req.body;
  const userId = req.user?._id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!memberId || !relation) return res.status(400).json({ message: "All fields are required" });
  if (!["father", "mother", "child", "sibling"].includes(relation)) return res.status(400).json({ message: "Invalid relation type" });

  try {
    const user = await User.findById(userId);
    const member = await User.findById(memberId);

    if (!user) return res.status(404).json({ message: "Current user not found" });
    if (!member) return res.status(404).json({ message: "Member user not found" });

    user.family.children ||= [];
    user.family.siblings ||= [];
    member.family.children ||= [];
    member.family.siblings ||= [];

    switch (relation) {
      case "father":
        if (user.family.father?.toString() === memberId) {
          user.family.father = null;
          member.family.children = member.family.children.filter(id => id.toString() !== userId.toString());
        }
        break;
      case "mother":
        if (user.family.mother?.toString() === memberId) {
          user.family.mother = null;
          member.family.children = member.family.children.filter(id => id.toString() !== userId.toString());
        }
        break;
      case "child":
        user.family.children = user.family.children.filter(id => id.toString() !== memberId.toString());
        if (user.gender === "male" && member.family.father?.toString() === userId.toString()) member.family.father = null;
        if (user.gender === "female" && member.family.mother?.toString() === userId.toString()) member.family.mother = null;
        break;
      case "sibling":
        user.family.siblings = user.family.siblings.filter(id => id.toString() !== memberId.toString());
        member.family.siblings = member.family.siblings.filter(id => id.toString() !== userId.toString());
        break;
    }

    await Promise.all([user.save(), member.save()]);

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.mother family.siblings family.children");

    res.status(200).json({ message: "Family member removed", user: populatedUser });
  } catch (err) {
    console.error("Remove family member error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};



