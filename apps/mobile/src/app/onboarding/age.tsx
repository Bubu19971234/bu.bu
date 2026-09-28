import { ADULT_AGE, ageOn, MIN_PLAYER_AGE, parseIsoDate, todayIso } from '@ftn/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, ErrorText, Field, Screen, Title } from '@/components/ui';

/** Age gate. The authoritative check runs in the database on submit. */
export default function AgeGate() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iso = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  if (blocked)
    return (
      <Screen>
        <Title>Ci vediamo presto!</Title>
        <Body>Per creare un profilo giocatore devi avere almeno {MIN_PLAYER_AGE} anni.</Body>
      </Screen>
    );

  return (
    <Screen>
      <Title>Quando sei nato?</Title>
      <Body muted>La data completa resta privata. Sul profilo pubblico mostriamo solo l’anno di nascita.</Body>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Giorno" keyboardType="number-pad" maxLength={2} value={day} onChangeText={setDay} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Mese" keyboardType="number-pad" maxLength={2} value={month} onChangeText={setMonth} />
        </View>
        <View style={{ flex: 1.4 }}>
          <Field label="Anno" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
      <Card>
        <Body small muted>
          Se hai tra {MIN_PLAYER_AGE} e {ADULT_AGE - 1} anni, il tuo profilo potrà diventare pubblico solo dopo l’approvazione di un genitore
          o tutore, con un suo account personale.
        </Body>
      </Card>
      <Button
        label="Continua"
        disabled={!day || !month || year.length !== 4}
        onPress={() => {
          if (!parseIsoDate(iso)) return setError('Data non valida.');
          const age = ageOn(iso, todayIso());
          if (age < 0 || age > 100) return setError('Data non valida.');
          if (age < MIN_PLAYER_AGE) return setBlocked(true);
          router.push({ pathname: '/onboarding/player', params: { dob: iso } });
        }}
      />
    </Screen>
  );
}
