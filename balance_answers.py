"""
Targeted second pass: directly swap ~40 A-answer questions to C or D to balance distribution.
"""
import json, random, os

BASE = r"C:\Users\kamix\Desktop\security-plus-study\data"

def audit_counts(all_q, label=""):
    c = {"A":0,"B":0,"C":0,"D":0,"multi":0}
    for q in all_q:
        a = q.get("answer")
        if isinstance(a, list): c["multi"] += 1
        elif a in c: c[a] += 1
    s = c["A"]+c["B"]+c["C"]+c["D"]
    t = sum(c.values())
    print(f"  {label}: A={c['A']}({c['A']/s*100:.1f}%) B={c['B']}({c['B']/s*100:.1f}%) "
          f"C={c['C']}({c['C']/s*100:.1f}%) D={c['D']}({c['D']/s*100:.1f}%) multi={c['multi']} total={t}")
    return c

def main():
    rng = random.Random(77)

    all_q = []
    sizes = []
    for n in range(1, 6):
        path = os.path.join(BASE, f"questions-{n}.json")
        with open(path, encoding="utf-8") as f:
            qs = json.load(f)
        all_q.extend(qs)
        sizes.append(len(qs))

    print("BEFORE second pass:")
    counts = audit_counts(all_q, "global")

    s = counts["A"]+counts["B"]+counts["C"]+counts["D"]
    target = s // 4  # ~25% each

    # Find single-answer MC/pbq questions with answer A
    a_questions = [q for q in all_q
                   if q.get("format") in ("multiple_choice", "pbq_scenario")
                   and q.get("answer") == "A"
                   and isinstance(q.get("options"), dict)]

    # How many to move: bring A down to ~28% max
    desired_a = int(s * 0.28)
    to_move = max(0, counts["A"] - desired_a)
    print(f"  Need to move {to_move} questions away from A (target <= {desired_a})")

    rng.shuffle(a_questions)
    targets = a_questions[:to_move]

    # Alternate between C and D as target positions
    target_letters = []
    need_c = max(0, target - counts["C"])
    need_d = max(0, target - counts["D"])
    for _ in range(need_c):
        target_letters.append("C")
    for _ in range(need_d):
        target_letters.append("D")
    # Fill remaining with B if needed
    while len(target_letters) < to_move:
        target_letters.append("B")
    rng.shuffle(target_letters)

    for q, new_letter in zip(targets, target_letters[:len(targets)]):
        opts = q["options"]
        correct_text     = opts["A"]
        displaced_text   = opts[new_letter]
        opts["A"]        = displaced_text
        opts[new_letter] = correct_text
        q["answer"]      = new_letter

    print("\nAFTER second pass:")
    audit_counts(all_q, "global")

    idx = 0
    for n, sz in enumerate(sizes, 1):
        path = os.path.join(BASE, f"questions-{n}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(all_q[idx:idx+sz], f, indent=2, ensure_ascii=False)
        idx += sz
        print(f"  Saved questions-{n}.json")

if __name__ == "__main__":
    main()
