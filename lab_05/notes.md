# Testowane endpointy API recenzji

## 1. GET /api/reviews/product/:productId

### Pobieranie wszystkich recenzji dla produktu
- Dodaje dwie recenzje testowe
- Weryfikuje kod statusu 200
- Sprawdza strukturę odpowiedzi
- Potwierdza, że zwrócono dwie recenzje

### Sortowanie recenzji
- Dodaje trzy recenzje z różnymi ocenami (2, 5, 3)
- Pobiera recenzje posortowane rosnąco według oceny
- Weryfikuje poprawność sortowania (2, 3, 5)

## 2. GET /api/reviews/product/:productId/stats

### Pobieranie statystyk recenzji
- Dodaje recenzje z różnymi ocenami (5, 4, 4, 3)
- Weryfikuje łączną liczbę recenzji (4)
- Sprawdza średnią ocenę (4)
- Potwierdza poprawność rozkładu ocen (0, 0, 1, 2, 1)

## 3. POST /api/reviews

### Dodawanie nowej recenzji
- Wysyła dane recenzji
- Weryfikuje kod statusu 201
- Sprawdza strukturę zwróconej recenzji
- Potwierdza aktualizację statystyk produktu

### Walidacja wymaganych pól
- Wysyła niekompletne dane recenzji
- Weryfikuje kod błędu 400
- Sprawdza obecność komunikatu błędu

## 4. PATCH /api/reviews/:id/helpful

### Zwiększanie liczby głosów "pomocne"
- Aktualizuje recenzję przez dodanie głosu
- Weryfikuje kod statusu 200
- Sprawdza zwiększenie licznika głosów
- Potwierdza aktualizację w bazie danych

### Zmniejszanie liczby głosów "pomocne"
- Tworzy recenzję z 2 głosami
- Zmniejsza liczbę głosów
- Weryfikuje kod statusu 200
- Potwierdza zmniejszenie licznika głosów

### Blokowanie ujemnych głosów
- Próbuje zmniejszyć liczbę głosów poniżej 0
- Weryfikuje kod błędu 400
- Sprawdza odpowiedni komunikat błędu

## 5. GET /api/reviews/search

### Wyszukiwanie recenzji po tekście
- Dodaje dwie recenzje z różną treścią
- Wyszukuje frazę "disappointing"
- Weryfikuje znalezienie jednej pasującej recenzji

### Filtrowanie recenzji po statusie weryfikacji
- Dodaje recenzje z różnymi statusami weryfikacji
- Filtruje po verifiedPurchase=true
- Weryfikuje znalezienie tylko zweryfikowanych recenzji

### Filtrowanie recenzji po zakresie ocen
- Dodaje recenzje z ocenami 2, 3, 4, 5
- Filtruje według minRating=4
- Sprawdza, czy wszystkie zwrócone recenzje mają oceny >= 4
- Potwierdza znalezienie dokładnie 2 recenzji