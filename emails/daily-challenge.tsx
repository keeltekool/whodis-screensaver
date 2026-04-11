import {
  Html, Head, Body, Container, Section, Text, Button, Hr,
} from "@react-email/components";

interface DailyChallengeEmailProps {
  date: string;
  dayNumber: number;
  challengeType: "game" | "deathmatch";
  teaser: string;
  challengeUrl: string;
  unsubscribeUrl: string;
}

export default function DailyChallengeEmail({
  date, dayNumber, challengeType, teaser, challengeUrl, unsubscribeUrl,
}: DailyChallengeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#131313", margin: 0, padding: 0, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ color: "#ffba20", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase" as const, textAlign: "center" as const, margin: "0 0 8px" }}>
            WHO DIS? — THE DAILY
          </Text>
          <Text style={{ color: "#e5e2e1", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" as const, textAlign: "center" as const, margin: "0 0 32px", opacity: 0.5 }}>
            {date} · #{dayNumber}
          </Text>

          <Section style={{ backgroundColor: "#1c1b1b", padding: "32px 24px", textAlign: "center" as const }}>
            <Text style={{ color: "#ffba20", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" as const, margin: "0 0 16px" }}>
              TODAY&apos;S DEATHMATCH
            </Text>
            <Text style={{ color: "#e5e2e1", fontSize: "18px", lineHeight: "1.4", margin: "0 0 24px", fontStyle: "italic" }}>
              &ldquo;{teaser}&rdquo;
            </Text>
            <Button
              href={challengeUrl}
              style={{
                backgroundColor: "#ffba20",
                color: "#131313",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
                padding: "16px 40px",
                textDecoration: "none",
              }}
            >
              PLAY TODAY&apos;S CHALLENGE →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#2a2a2a", margin: "32px 0" }} />

          <Text style={{ color: "#666", fontSize: "11px", textAlign: "center" as const, lineHeight: "1.6" }}>
            You&apos;re receiving this because you subscribed to WHO DIS? THE DAILY.
          </Text>
          <Text style={{ textAlign: "center" as const, margin: "8px 0 0" }}>
            <a href={unsubscribeUrl} style={{ color: "#666", fontSize: "11px", textDecoration: "underline" }}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
