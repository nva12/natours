/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe('pk_test_wBQPcIaeNFEP0kSKmFhclToC00s9UoX7A6');

export const bookTour = async tourId => {
  try {
    // get checkout session from api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // create a checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
